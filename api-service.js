const BASE_URL = "https://aifoodies.up.railway.app/api";

const apiService = {
    token: localStorage.getItem("adminToken") || null,

    setToken(t){
        this.token = t;
        localStorage.setItem("adminToken", t);
    },

    // ========= ADMIN =========
    async adminLogin(username,password){
        const res = await fetch(`${BASE_URL}/admin/login`, {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({username,password})
        });
        return res.json();
    },

    // ========= PRODUCTS / MENU =========
    getMenu(category){ 
        return fetch(`${BASE_URL}/menu-items?category=${category}`).then(r=>r.json()); 
    },
    getAllProducts(){ return fetch(`${BASE_URL}/menu-items`).then(r=>r.json()); },

    createProduct(data){
        return fetch(`${BASE_URL}/products`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer "+this.token
            },
            body:JSON.stringify(data)
        }).then(r=>r.json());
    },

    updateProduct(id,data){
        return fetch(`${BASE_URL}/products/${id}`,{
            method:"PUT",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer "+this.token
            },
            body:JSON.stringify(data)
        }).then(r=>r.json());
    },

    deleteProduct(id){
        return fetch(`${BASE_URL}/products/${id}`,{
            method:"DELETE",
            headers:{ "Authorization":"Bearer "+this.token }
        }).then(r=>r.json());
    },

    setAvailability(id,available){
        return fetch(`${BASE_URL}/products/${id}/availability`, {
            method:"PUT",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer "+this.token
            },
            body:JSON.stringify({available})
        }).then(r=>r.json());
    },

    // ========= ORDERS =========
    submitOrder(order){
        return fetch(`${BASE_URL}/orders`,{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify(order)
        }).then(r=>r.json());
    },

    getOrders(){
        return fetch(`${BASE_URL}/orders`,{
            headers:{ "Authorization":"Bearer "+this.token }
        }).then(r=>r.json());
    }
};
