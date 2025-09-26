const BASE_URL="https://todo-website-backend.onrender.com/api";

// DOM elements
const signupContainer = document.getElementById("signup-container");
const signinContainer = document.getElementById("signin-container");
const todoContainer = document.getElementById("todo-container");

const showSigninLink = document.getElementById("show-signin");
const showSignupLink = document.getElementById("show-signup");

const signupForm = document.getElementById("signup-form");
const signinForm = document.getElementById("signin-form");
const logoutbtn = document.getElementById("logout-button");

const responseMessage = document.getElementById("response-message");
const todoList = document.getElementById("todo-list");
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");

function showMessage(msg, isError = false) {
  responseMessage.textContent = msg;
  responseMessage.style.color = isError ? "#ff6b6b" : "#FFD700";
}

// Toggle signup/signin views
showSigninLink.addEventListener("click", (e) => {
  e.preventDefault();
  signupContainer.style.display = "none";
  signinContainer.style.display = "block";
  todoContainer.style.display = "none";
  showMessage("");
});

showSignupLink.addEventListener("click", (e) => {
  e.preventDefault();
  signupContainer.style.display = "block";
  signinContainer.style.display = "none";
  todoContainer.style.display = "none";
  showMessage("");
});

// ------------------ SIGNUP ------------------
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signup-name")?.value?.trim();
  const email = document.getElementById("signup-email")?.value?.trim();
  const password = document.getElementById("signup-password")?.value;

  if (!name || !email || !password) {
    showMessage("Please fill name, email and password.", true);
    return;
  }

  try {
    showMessage("Signing up...");
    const res = await fetch(`${BASE_URL}/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      showMessage(data.message || "User created. Please signin");
      signupForm.reset();
      signupContainer.style.display = "none";
      signinContainer.style.display = "block";
    } else {
      showMessage(data.message || "Signup failed", true);
      console.error("Signup error detail:", data);
    }
  } catch (err) {
    console.error(err);
    showMessage("Network/server error during signup", true);
  }
});

// ------------------ SIGNIN ------------------
signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signin-email")?.value?.trim();
  const password = document.getElementById("signin-password")?.value;

  if (!email || !password) {
    showMessage("Please enter email and password", true);
    return;
  }

  try {
    showMessage("Signing in...");
    const res = await fetch(`${BASE_URL}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      showMessage(data.message || "Login successful!");
      signinForm.reset();
      signinContainer.style.display = "none";
      todoContainer.style.display = "block";
      fetchTodos();
    } else {
      showMessage(data.message || "Signin failed", true);
      console.error("Signin error detail:", data);
    }
  } catch (err) {
    console.error(err);
    showMessage("Network/server error during signin", true);
  }
});

// ------------------ FETCH TODOS ------------------
async function fetchTodos() {
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Please sign in to see your todos.", true);
    return;
  }

  try {
    showMessage("Loading your todos...");
    const res = await fetch(`${BASE_URL}/todo/`, {
      method: "GET",
      headers: { "Content-Type": "application/json", "token": token },
    });

    const data = await res.json();
    if (res.ok) {
      renderTodos(data.todos || []);
      showMessage("Todos loaded!");
    } else {
      showMessage(data.message || "Failed to fetch todos", true);
      if (res.status === 401 || res.status === 403) localStorage.removeItem("token");
    }
  } catch (err) {
    console.error("fetchTodos error:", err);
    showMessage("Error fetching todos", true);
  }
}

function renderTodos(todos) {
  todoList.innerHTML = "";
  if (!todos.length) {
    const empty = document.createElement("li");
    empty.textContent = "No todos yet, add your first task";
    empty.style.opacity = "0.8";
    todoList.appendChild(empty);
    return;
  }

  todos.forEach((todo) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = todo.title || "(no title)";
    if (todo.done) {
      span.style.textDecoration = "line-through";
      span.style.opacity = "0.7";
    }
    span.style.marginRight = "10px";

    // Toggle done button
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = todo.done ? "Mark undone" : "Mark done";
    toggleBtn.style.marginRight = "8px";
    toggleBtn.addEventListener("click", () => toggleTodoDone(todo._id, todo.title || "", todo.done));

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      if (confirm("Delete this todo?")) deleteTodo(todo._id);
    });

    li.appendChild(span);
    li.appendChild(toggleBtn);
    li.appendChild(delBtn);
    todoList.appendChild(li);
  });
}

// ------------------ CREATE TODO ------------------
todoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = todoInput.value?.trim();
  if (!title) return showMessage("Please enter a todo title", true);

  const token = localStorage.getItem("token");
  if (!token) return showMessage("You must be signed in to create a todo", true);

  try {
    showMessage("Creating todo...");
    const res = await fetch(`${BASE_URL}/todo/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "token": token },
      body: JSON.stringify({ title, description: "" }),
    });

    const data = await res.json();
    if (res.ok) {
      showMessage(data.message || "Todo created!");
      todoForm.reset();
      fetchTodos();
    } else {
      showMessage(data.message || "Failed to create todo", true);
    }
  } catch (err) {
    console.error("createTodo error:", err);
    showMessage("Network/server error when creating todo", true);
  }
});

// ------------------ DELETE TODO ------------------
async function deleteTodo(id) {
  const token = localStorage.getItem("token");
  if (!token) return showMessage("Not signed in", true);

  try {
    showMessage("Deleting todo...");
    const res = await fetch(`${BASE_URL}/todo/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "token": token },
    });

    const data = await res.json();
    if (res.ok) {
      showMessage(data.message || "Todo deleted");
      fetchTodos();
    } else showMessage(data.message || "Failed to delete todo", true);
  } catch (err) {
    console.error("deleteTodo error:", err);
    showMessage("Network error when deleting todo", true);
  }
}

// ------------------ TOGGLE DONE ------------------
async function toggleTodoDone(id, title, currentDone) {
  const token = localStorage.getItem("token");
  if (!token) return showMessage("Not signed in", true);

  try {
    showMessage("Updating todo...");
    const res = await fetch(`${BASE_URL}/todo/UpdateTodo`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "token": token },
      body: JSON.stringify({ _id: id, title, description: "", done: !currentDone }),
    });

    const data = await res.json();
    if (res.ok) {
      showMessage(data.message || "Todo updated");
      fetchTodos();
    } else showMessage(data.message || "Failed to update todo", true);
  } catch (err) {
    console.error("toggleTodoDone error:", err);
    showMessage("Network error when updating todo", true);
  }
}

// ------------------ LOGOUT ------------------
logoutbtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  showMessage("You are logged out");
  signupContainer.style.display = "none";
  signinContainer.style.display = "block";
  todoContainer.style.display = "none";
});

// ------------------ INIT ON LOAD ------------------
(function initOnLoad() {
  const token = localStorage.getItem("token");
  if (token) {
    signupContainer.style.display = "none";
    signinContainer.style.display = "none";
    todoContainer.style.display = "block";
    fetchTodos();
  }
})();














                                        // const BASE_URL="https://todo-website-backend.onrender.com/api";

                                        // //Dom elements
                                        // const signupContainer=document.getElementById("signup-container");
                                        // const signinContainer=document.getElementById("signin-container");
                                        // const todoContainer=document.getElementById("todo-container");

                                        // const showSigninLink=document.getElementById("show-signin");
                                        // const showSignupLink=document.getElementById("show-signup");



                                        // const signupForm = document.getElementById("signup-form");
                                        // const signinForm = document.getElementById("signin-form");
                                        // const logoutbtn=document.getElementById("logout-button");

                                        // const responseMessage = document.getElementById("response-message");

                                        // function showMessage(msg,isError=false){
                                        //     responseMessage.textContent=msg;
                                        //     responseMessage.style.color=isError ? "#ff6b6b" : "#FFD700";
                                        // }
                                        // showSigninLink.addEventListener("click",(e)=>{
                                        //     e.preventDefault();//ensure page dont jump

                                        //     signupContainer.style.display="none";
                                        //     signinContainer.style.display="block";
                                        //     todoContainer.style.display="none";

                                        //     showMessage("");
                                        // });

                                        // showSignupLink.addEventListener("click",(e)=>{
                                        //     e.preventDefault();

                                        //     signupContainer.style.display="block";
                                        //     signinContainer.style.display="none";
                                        //     todoContainer.style.display="none";
                                        //     showMessage("");
                                        // });

                                        // signupForm.addEventListener("submit",async (e)=>{
                                        //     e.preventDefault();

                                        //     const name=document.getElementById("signup-name")?.value?.trim();
                                        //     const email=document.getElementById("signup-email")?.value?.trim();
                                        //     const password=document.getElementById("signup-password")?.value;

                                        //     if(!name || !email || !password){
                                        //         showMessage("Please fill name, email and password.", true);
                                        //         return;
                                        //     }



                                        // try{
                                        //     showMessage("signing up....");

                                        //     const res=await fetch(`${BASE_URL}/user/signup`,{
                                        //         method:"POST",
                                        //         headers:{ "Content-Type": "application/json" },
                                        //         body:JSON.stringify({name,email,password}),
                                        //     });

                                        //     const data=await res.json();

                                        //     if(res.ok){
                                        //         showMessage(data.message || "user created.Please signin");

                                        //         signupForm.reset();

                                        //         signupContainer.style.display="none";
                                        //         signinContainer.style.display="block";
                                        //     }

                                        //     else{
                                        //         showMessage(data.message || "Signup failed",true);

                                        //         console.error("Signup error detail:", data);
                                        //     }
                                        // }
                                        // catch(err){
                                        //     console.error(err);
                                        //     showMessage("Network or server error .Is backend running?")
                                        // }
                                        // });

                                        // signinForm.addEventListener("submit",async (e)=>{
                                        //     e.preventDefault();

                                        //     const email=document.getElementById("signin-email")?.value?.trim();
                                        //     const password=document.getElementById("signin-password")?.value;

                                        //     if(!email || !password){
                                        //         showMessage("Please enter email and password",true);
                                        //         return;
                                        //     }

                                        //     try{
                                        //         showMessage("Signing in...");
                                        //         const res=await fetch(`${BASE_URL}/user/login`,{
                                        //             method:"POST",
                                        //             headers: { "Content-Type": "application/json" },
                                        //             body: JSON.stringify({ email, password }),
                                        //         });

                                        //         const data=await res.json();

                                        //         if(res.ok){
                                        //             localStorage.setItem("token",data.token);

                                        //             showMessage(data.message || "Login successfull!");

                                        //             signinForm.reset();

                                        //             signinContainer.style.display="none";
                                        //             todoContainer.style.display="block";

                                        //         }else{
                                        //              showMessage(data.message || "Signin failed", true);
                                        //             console.error("Signin error detail:", data);
                                        //         }

                                        //     }
                                        //     catch(err){
                                        //         console.error(err);
                                        //         showMessage("Network/server error during signin",true);

                                        //     }
                                        // });

                                        // //FEtch todo from backend 

                                        // // async function fetchTodos(){
                                        // //     const token=localStorage.getItem("token");

                                        // //     if(!token){
                                        // //         showMessage("No token found. Please sign in again",true);
                                        // //         return;
                                        // //     }
                                        // //     try{
                                        // //         showMessage("Loadig your todos...");
                                        // //         const res=await fetch(`${BASE_URL}/todo`,{
                                        // //             method:"GET",
                                        // //             headers:{
                                        // //                  "Content-Type": "application/json",
                                        // //                 "token": token 

                                        // //             }
                                        // //         });

                                        // //         const data=await res.json();

                                        // //         if(res.ok){
                                        // //             showMessage("Todo loaded!");
                                        // //             renderTodos(data);
                                        // //         }
                                        // //         else{
                                        // //             showMessage(data.message || "Failed to fetch todos",true);
                                        // //         }
                                        // //     }
                                        // //     catch(err){
                                        // //         console.error(err);
                                        // //         showMessage("Error fetching todos",true);
                                        // //     }
                                        // // }

                                        // // function renderTodos(todos){
                                        // //     const todoList=document.getElementById("todo-list");
                                        // //     todoList.innerHTML="";
                                        // //     todos.forEach(todo => {
                                        // //         const li=document.createElement("li");
                                        // //         li.innerHTML=`
                                        // //         <span>${todo.title}</span>
                                        // //         <button onclick="deleteTodo('{todo._id}')">DElete</button>
                                        // //         `;
                                        // //         todoList.appendChild(li);
                                        // //     });
                                        // // }

                                        // const todoList=document.getElementById("todo-list");
                                        // const todoForm=document.getElementById("todo-form");
                                        // const todoInput=document.getElementById("todo-input");

                                        // async function fetchTodos(){
                                        //     const token=localStorage.getItem("token");

                                        //     if(!token){
                                        //         showMessage("Please sign in to see your todos.",true);
                                        //         return;
                                        //     }

                                        //     try{
                                        //         showMessage("Loading your todos...");
                                        //         const res=await fetch(`${BASE_URL}/todo/`,{
                                        //             method:"GET",
                                        //             headers:{
                                        //                 "Content-Type": "application/json",
                                        //                 "token": token
                                        //             }
                                        //         });

                                        //         const data=await res.json();

                                        //         if(res.ok){
                                        //             const todos=data.todos || [];
                                        //             showMessage("Todos loaded!");
                                        //             renderTodos(todos);
                                        //         }
                                        //         else{
                                        //             showMessage(data.message || "Failed to fetch todos",true);
                                        //             if(res.status===403 || res.status===401){
                                        //                 localStorage.removeItem("token");
                                        //             }
                                        //         }
                                        //     }
                                        //     catch(err){
                                        //         console.error("fetchTodos error:",err);
                                        //         showMessage("Error fetching todos.",true);
                                        //     }
                                        // }

                                        // function renderTodos(todos){
                                        //     todoList.innerHTML="";
                                        //     if(!todos.length){
                                        //         const empty=document.createElement("li");
                                        //         empty.textContent="No todos yet,Add your first task";
                                        //         empty.style.opacity="0.8";
                                        //         todoList.appendChild(empty);
                                        //         return;
                                        //      }

                                        //      todos.forEach((todo)=>{
                                        //         const li=document.createElement("li");
                                        //         const span=document.createElement("span");
                                        //         span.textContent=todo.title || "(no title)";

                                        //         if(todo.done){
                                        //             span.style.textDecoration="line-through";
                                        //             span.style.opacity="0.7";
                                        //         }

                                        //         //Delete button
                                        //         const delbtn=document.createElement("button");
                                        //         delbtn.textContent = "Delete";
                                                
                                        //         //add event listen which calles the deletetodo with the correct todo id
                                        //         delbtn.addEventListener("click", () => {
                                        //             if(confirm("Delete this todo?")){
                                        //                 deleteTodo(todo._id);
                                        //             }
                                        //         });

                                        //         const toggleBtn=document.createElement("button");
                                        //         toggleBtn.textContent=todo.done ? "Mark undone" : "Mark done";
                                        //         toggleBtn.style.marginRight="8px";
                                        //         toggleBtn.addEventListener("click", ()=>{
                                        //             toggleTodoDone(todo._id,!todo.done);
                                        //         });

                                        //         span.style.marginRight="10px";
                                        //         li.appendChild(span);
                                        //         li.appendChild(toggleBtn);
                                        //         li.appendChild(delbtn);
                                        //         todoList.appendChild(li);

                                        //      });
                                        // }

                                        // todoForm.addEventListener("submit",async (e) => {
                                        //     e.preventDefault();

                                        //     const title=todoInput.value?.trim();
                                        //     if(!title){
                                        //         showMessage("Please enter a todo title",true);
                                        //         return;
                                        //     }

                                        //     const token=localStorage.getItem("token");
                                        //     if(!token){
                                        //         showMessage("you must be signed in to create a todo",true);
                                        //         return;
                                        //     }

                                        //     try{
                                        //         showMessage("Creating todo...");

                                        //         const res=await fetch(`${BASE_URL}/todo/create`,{
                                        //             method:"POST",
                                        //             headers:{
                                        //                  "Content-Type": "application/json",
                                        //                  "token": token
                                        //             },
                                        //             body:JSON.stringify({
                                        //                 title:title,
                                        //                 description:""
                                        //             })
                                        //         });

                                        //         const data=await res.json();

                                        //         if(res.ok){
                                        //             showMessage(data.message || "Todo created!");
                                        //             todoForm.reset();
                                        //             fetchTodos();
                                        //         }
                                        //         else{
                                        //             showMessage(data.message ||"Failed to create todo",true);
                                        //             if(res.status===403 || res.status===401){
                                        //                 localStorage.removeItem("token");
                                        //             }
                                        //         }
                                        //     } catch(err){
                                        //         console.error("createdTodo error",err);
                                        //         showMessage("Network/server error when creating todo",true);
                                        //     }
                                        // });

                                        // /*
                                        //  * deleteTodo - call DELETE /api/todo/:id with token header
                                        //  */

                                        // async function deleteTodo(id){
                                        //     const token=localStorage.getItem("token");

                                        //     if(!token){
                                        //         showMessage("Not signed in",true);
                                        //         return;
                                        //     }

                                        //     try{
                                        //         showMessage("Deleting todo...");
                                        //         const res=await fetch(`${BASE_URL}/todo/${id}`,
                                        //             {
                                        //                 method:"DELETE",
                                        //                 headers:{
                                        //                     "Content-Type": "application/json",
                                        //                     "token": token

                                        //                 }
                                        //             }
                                        //         );

                                        //         const data=await res.json();

                                        //         if(res.ok){
                                        //             showMessage(data.message || "Todo deleted");
                                        //             fetchTodos();
                                        //         }
                                        //         else{

                                        //             showMessage(data.message ||"Failed to delete todo",true);
                                        //         }
                                        //     }
                                        //     catch(err){
                                        //         console.error("Deletetodo error",err);
                                        //         showMessage("Network error when deleting todo",true);
                                        //     }
                                        // }

                                        // /*
                                        //  * toggleTodoDone - update a todo's done state via PUT /api/todo/UpdateTodo
                                        //  * We send {_id, title, description, done}. We'll keep title same as before (minimal).
                                        //  * Better: fetch the single todo first. For simplicity we toggle done and only send _id + done + title.
                                        //  */
                                        // async function toggleTodoDone(id, newDone) {
                                        //   const token = localStorage.getItem("token");
                                        //   if (!token) {
                                        //     showMessage("Not signed in", true);
                                        //     return;
                                        //   }

                                        //   try {
                                        //     showMessage("Updating todo...");

                                        //     // Minimal update: we only send _id and done. Backend expects title/description too,
                                        //     // but findOneAndUpdate will accept partial fields. To be safe, we'll send done only.
                                        //     const res = await fetch(`${BASE_URL}/todo/UpdateTodo`, {
                                        //       method: "PUT",
                                        //       headers: {
                                        //         "Content-Type": "application/json",
                                        //         "token": token
                                        //       },
                                        //       body: JSON.stringify({
                                        //         _id: id,
                                        //         done: newDone
                                        //       })
                                        //     });

                                        //     const data = await res.json();

                                        //     if (res.ok) {
                                        //       showMessage(data.message || "Todo updated");
                                        //       fetchTodos();
                                        //     } else {
                                        //       showMessage(data.message || "Failed to update todo", true);
                                        //     }
                                        //   } catch (err) {
                                        //     console.error("toggleTodoDone error:", err);
                                        //     showMessage("Network error when updating todo", true);
                                        //   }
                                        // }


                                        // logoutbtn.addEventListener("click",()=>{
                                        //     localStorage.removeItem("token");
                                        //     showMessage("You are logout successfully");

                                        //     //display the login page
                                        //     todoContainer.style.display="none";
                                        //     signinContainer.style.display="block";
                                        //     signupContainer.style.display="none";
                                        // });
                                        // // -------------------------
                                        // // Auto-run on page load: if token exists, go to todos view and fetch
                                        // // -------------------------
                                        // (function initOnLoad() {
                                        //   const token = localStorage.getItem("token");
                                        //   if (token) {
                                        //     // Hide signup/signin and show todo UI
                                        //     signupContainer.style.display = "none";
                                        //     signinContainer.style.display = "none";
                                        //     todoContainer.style.display = "block";

                                        //     // fetch the user's todos
                                        //     fetchTodos();
                                        //   }
                                        // })();

