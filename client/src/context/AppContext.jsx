import {  createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";
import axios from 'axios';

axios.defaults.withCredentials = true;  // CRITICAL for sending cookies
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext =createContext();

export const AppContextProvider =({children})=>{

    const currency = import.meta.env.VITE_CURRENCY;

    const navigate =useNavigate();
    const [user,setUser]=useState(null)
    const [isSeller,setIsSeller]=useState(false)
    const [isSellerLoading, setIsSellerLoading] = useState(true); // Add loading state
    const [showUserLogin,setShowUserLogin]=useState(false)
    const [products,setProducts]=useState([])

    const [cartItems,setCartItems]=useState({})
    const [searchQuery,setSearchQuery]=useState({})
    const [isLoading, setIsLoading] = useState(true);


    

    // Fetch seller status

 const fetchSeller = async()=>{
    setIsSellerLoading(true);
    try {
        const { data } = await axios.get('/api/seller/is-auth');
        if (data.success) {
            setIsSeller(true);
        } else {
            setIsSeller(false);
        }
    } catch (error) {
        setIsSeller(false);
        console.error("Auth check failed:", error.message);
    }  finally {
        setIsSellerLoading(false);
    }
    }

   

    // Fetch all products
    const fetchProducts = async()=>{
        try {
            const {data}= await axios.get('/api/product/list')
            console.log(data)
            if(data.success){
                setProducts(data.products)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }finally {
            setIsLoading(false);
        }
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
        fetchSeller();
        fetchProducts()
        
    },[])


    const value={navigate,user,setUser,isSeller,setIsSeller,showUserLogin,setShowUserLogin,products,currency,cartItems,addToCart,updateCartQuantity,removeFromCart,searchQuery,setSearchQuery,getCartCount,getCartAmount,axios,isSellerLoading,fetchProducts,isLoading}
    return<AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>
}

export const useAppContext =()=>{
    return useContext(AppContext)
}