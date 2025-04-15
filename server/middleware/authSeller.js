import jwt from "jsonwebtoken";


const authSeller =async(req,res,next)=>{
    const {sellerToken} =req.cookies;

    if(!sellerToken){
         return res.json({ success: false, message: "Not Authorized" });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    
        if (tokenDecode.email ===process.env.SELLER_EMAIL) {
            next();
        //   req.body.userId = tokenDecode.id;
        // if (!req.body) req.body = {};
        // req.body.userId = tokenDecode.id;
        } else {
          return res.json({ success: false, message: "Not Authorized" });
        }
    
        
      } catch (error) {
        return res.json({ success: false, message: error.message });
      }
}

export default authSeller;