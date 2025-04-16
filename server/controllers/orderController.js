import Order from "../models/order.js";
import Product from "../models/product.js";

// place order COD: /api/order/cod
export const placeOrderCOD = async(req,res)=>{
    try {
        const {userId,items,address}=req.body;
        if(!address || items.length===0){
            res.json({success:false, message:"invalid data"})
        }
        // calculate amount using items
        let amount = await items.reduce(async(ActiveXObject,item)=>{
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
            paymentType:"COD"
        })

        res.json({success:true, message:"Order Placed Successfully"})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message});
    }
}
