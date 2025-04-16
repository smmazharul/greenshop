import {  createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";
import axios from 'axios';

axios.defaults.withCredentials=true;
axios.defaults.baseURL=import.meta.env.VITE_BACKEND_URL;

export const AppContext =createContext();

export const AppContextProvider =({children})=>{

    const currency = import.meta.env.VITE_CURRENCY;

    const navigate =useNavigate();
    const [user,setUser]=useState(null)
    // const [isSeller,setIsSeller]=useState(false)
    const [showUserLogin,setShowUserLogin]=useState(false)
    const [products,setProducts]=useState([])

    const [isSeller, setIsSeller] = useState(() => {
        return localStorage.getItem('isSeller') === 'true';
    });
    


    const [cartItems,setCartItems]=useState({})
    const [searchQuery,setSearchQuery]=useState({})


    // Persist seller status to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('isSeller', String(isSeller));
    }, [isSeller]);

    // Fetch seller status

 const fetchSeller = async()=>{
        try {
            const {data}=await axios.get('/api/seller/is-auth')
            console.log(data)
            if(data.success){
                setIsSeller(true)
            }else{
                setIsSeller(false)
            }
        } catch (error) {
            setIsSeller(false)
            toast.error(error.message)
            
        }
    }

      // Check authentication status on page load
      useEffect(() => {
        if (user) {
            fetchSeller();
        }
    }, []);

    // Fetch all products
    const fetchProducts = async()=>{
        setProducts(dummyProducts)
    }

    // add product to cart 
    const addToCart =(itemId)=>{
        let cartData= structuredClone(cartItems);
        if(cartData[itemId]){
            cartData[itemId]+=1
        }else{
            cartData[itemId] = 1
        }
        setCartItems(cartData)
        toast.success("Added to Cart")
    }

    // update cart item quantity
    const updateCartQuantity =(itemId,quantity)=>{
        let cartData= structuredClone(cartItems);
        cartData[itemId] = quantity;
        setCartItems(cartData)
        toast.success("Cart Updated")
    }

    // Remove product from cart 
    const removeFromCart=(itemId)=>{
        let cartData= structuredClone(cartItems);
        if(cartData[itemId] ){
            cartData[itemId]-=1
            if(cartData[itemId]===0){
                delete cartData[itemId]
            }
        }
        setCartItems(cartData)
        toast.success("remove Form cart")
        
    }

    // get cart item count

    const getCartCount=()=>{
        let totalCount =0;
        for(const item in cartItems){
            totalCount+=cartItems[item];
        }
        return totalCount;
    }

    // get Cart Total Amount 
    const getCartAmount = ()=>{
        let totalAmount =0;
        for(const items in cartItems){
           let itemInfo = products.find((product)=>product._id===items);
           if(cartItems[items]>0){
            totalAmount += itemInfo.offerPrice * cartItems[items]
           }
        }
        return Math.floor(totalAmount*100)/100;
    }



    useEffect(()=>{
        fetchProducts()
        
    },[])


    const value={navigate,user,setUser,isSeller,setIsSeller,showUserLogin,setShowUserLogin,products,currency,cartItems,addToCart,updateCartQuantity,removeFromCart,searchQuery,setSearchQuery,getCartCount,getCartAmount,axios}
    return<AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>
}

export const useAppContext =()=>{
    return useContext(AppContext)
}