if(process.env.NODE_ENV!=='production'){
    require('dotenv').config();
}


const express=require('express');
const path=require('path');
const app=express();
const initializePassport=require('./passportconfig');
const bcrypt=require('bcrypt');
const users=[];
const passport=require('passport');
const flash=require('express-flash');
const session=require('express-session');
const methodOverride=require('method-override');
app.use(methodOverride('_method'));

initializePassport(
    passport,
    email=>users.find(user=>user.email===email),
    id=> users.find(user=>user.id===id)
);

app.use('/static',express.static(path.join(__dirname,'public')));

app.use(flash());
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session()); 

app.set('view engine','ejs');
app.use(express.urlencoded({extended:false}));

app.get('/', checkAuthenticated,(req,res)=>{
    res.render('index.ejs',{user: req.user.name});
})

app.get('/login',checkNotAuthenticated,(req,res)=>{
    res.render('login.ejs');
})

app.post('/login',checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))

app.get('/register',checkNotAuthenticated, (req,res)=>{
    res.render('register.ejs');
})

app.post('/register',checkNotAuthenticated, async(req,res)=>{
   try {
       const hashedPAssword=await bcrypt.hash(req.body.password,10);
       users.push({
           id:Date.now().toString(),
           name:req.body.name,
           email:req.body.email,
           password:hashedPAssword
       })
       res.redirect('/login');
   } catch (error) {
       res.redirect('/register');
   }
   console.log(users);
})


app.delete('/logout',(req,res)=>{
    req.logOut();
    res.redirect('./login');
})


function checkAuthenticated(req,res,next){
    if(req.isAuthenticated())
    return next();

    res.redirect('/login');
}

function checkNotAuthenticated(req,res,next){
    if(req.isAuthenticated())
    return res.redirect('/');

    next();

    
}

app.listen(3000,()=>{
    console.log('server started successfully');
})