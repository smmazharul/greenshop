
import Order from "../models/Order.js";
import Product from "../models/product.js";
import stripe from 'stripe'
import User from "../models/User.js"


// place order COD: /api/order/cod
export const placeOrderCOD = async(req,res)=>{
    try {
        const {userId,items,address}=req.body;
        if(!address || items.length===0){
            res.json({success:false, message:"invalid data"})
        }
        // calculate amount using items
        let amount = await items.reduce(async(acc,item)=>{
            const product = await Product.findById(item.product)
            return (await acc) +product.offerPrice*item.quantity;
        },0)

        // add tax charge (2%)
        amount +=Math.floor(amount*0.02);

        await Order.create({
            userId,
            items,
            amount,
            address,
            PaymentType:"COD"
        });

        res.json({success:true, message:"Order Placed Successfully"})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message});
    }
}
// place order stripe: /api/order/stripe
export const placeOrderStripe = async(req,res)=>{
    try {
        const {userId,items,address}=req.body;
        const {origin} = req.headers;

        if(!address || items.length===0){
            res.json({success:false, message:"invalid data"})
        }

        let productData=[]
        // calculate amount using items
        let amount = await items.reduce(async(acc,item)=>{
            const product = await Product.findById(item.product)
            productData.push({
                name:product.name,
                price:product.offerPrice,
                quantity:item.quantity
            })
            return (await acc) +product.offerPrice*item.quantity;
        },0)

        // add tax charge (2%)
        amount +=Math.floor(amount*0.02);

      const order=  await Order.create({
            userId,
            items,
            amount,
            address,
            PaymentType:"Online"
        })


        // stripe gateway initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        // create line items for stripe
        const line_items = productData.map((item)=>{
            return{
                price_data:{
                    currency:"usd",
                    product_data:{
                        name:item.name,
                    },
                    unit_amount:Math.floor(item.price + item.price*0.02)*100
                },
                quantity:item.quantity,
            }
        })

        // create session
        const session= await stripeInstance.checkout.sessions.create({
            line_items,
            mode:"payment",
            success_url:`${origin}/loader?next=my-orders`,
            cancel_url:`${origin}/cart`,
            metadata:{
                orderId:order._id.toString(),
                userId,
            }
        })

        res.json({success:true,url:session.url })
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message});
    }
}


// Stripe webhooks to verify payment action: /stripe

// export const stripeWebhooks=async(req,res)=>{
//      // stripe gateway initialize
//      const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);


//      const sig= req.headers["stripe-signature"];
//      let event;
//      try {
//         event=stripeInstance.webhooks.constructEvent(
//             req.body,
//             sig,
//             process.env.STRIPE_WEBHOOK_SECRET
//         );
//      } catch (error) {
//        return res.status(400).send(`WebHook Error: ${error.message}`)
//      }

// // handel the event
//      switch (event.type) {
//         case "payment_intent.succeeded":{
//             const paymentIntent = event.data.object;
//             const paymentIntentId = paymentIntent.id;

//             // getting session meta data
//             const session = await stripeInstance.checkout.sessions.list({
//                 payment_intent:paymentIntentId,
//             })
//             const {orderId,userId} = session.data[0].metadata;

//             // mark payment as paid
//             await Order.findByIdAndUpdate(orderId,{isPaid:true})

//             // clear user cart
//             await User.findByIdAndUpdate(userId,{cartItems:{}})
//             break;
//         }
            
//         case "payment_intent.payment_failed":{
//             const paymentIntent = event.data.object;
//             const paymentIntentId = paymentIntent.id;

//             // getting session meta data
//             const session = await stripeInstance.checkout.sessions.list({
//                 payment_intent:paymentIntentId,
//             })
//             const {orderId} = session.data[0].metadata;

//             await Order.findByIdAndDelete(orderId)
//             break
//         }


//         default:
//             console.error(`Unhandled event type ${event.type}`)
//             break;
//      }
//      res.json({received:true});

// }

export const stripeWebhooks = async (req, res) => {
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];
  
    let event;
    try {
      event = stripeInstance.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("❌ Signature verification failed:", error.message);
      return res.status(400).send(`WebHook Error: ${error.message}`);
    }
  
    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object;
          const paymentIntentId = paymentIntent.id;
  
          const sessionList = await stripeInstance.checkout.sessions.list({
            payment_intent: paymentIntentId,
          });
  
          const session = sessionList.data[0];
  
          if (!session || !session.metadata) {
            console.error("❌ Session or metadata missing");
            return res.status(400).send("Missing metadata");
          }
  
          const { orderId, userId } = session.metadata;
  
          const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { isPaid: true },
            { new: true }
          );
  
          if (!updatedOrder) {
            console.error("❌ Order update failed");
            return res.status(500).send("Failed to update order");
          }
  
          console.log("✅ Order marked as paid:", updatedOrder._id);
  
          await User.findByIdAndUpdate(userId, { cartItems: {} });
          break;
        }
  
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object;
          const paymentIntentId = paymentIntent.id;
  
          const sessionList = await stripeInstance.checkout.sessions.list({
            payment_intent: paymentIntentId,
          });
  
          const session = sessionList.data[0];
  
          if (!session || !session.metadata) {
            console.error("❌ Failed payment: missing metadata");
            return res.status(400).send("Missing metadata");
          }
  
          const { orderId } = session.metadata;
          await Order.findByIdAndDelete(orderId);
  
          console.log("🗑️ Order deleted due to failed payment:", orderId);
          break;
        }
  
        default:
          console.warn(`⚠️ Unhandled event type: ${event.type}`);
          break;
      }
  
      res.json({ received: true });
    } catch (error) {
      console.error("❌ Webhook processing error:", error.message);
      res.status(500).send(`Webhook Error: ${error.message}`);
    }
  };



// get order by user ID: /api/order/user

export const getUserOrders =async(req,res)=>{
    try {
        const { userId } = req.body;
        
        const orders = await Order.find({userId,$or:[{PaymentType:"COD"},{isPaid:true}]
        }).populate("items.product address").sort({createdAt:-1});
        res.json({success:true, orders})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message});
    }
}

// get all order (for seller /admin): /api/order/seller
export const getAllOrders =async(req,res)=>{
    try {
        const orders = await Order.find({ $or:[{PaymentType:"COD"},{isPaid:true}]
        }).populate("items.product address").sort({createdAt:-1});
        res.json({success:true, orders})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message});
    }
}
