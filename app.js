const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use(express.static("public"));

mongoose.connect("mongodb+srv://new-user:test1234@cluster0.abiqu.mongodb.net/todolistDB",{useNewUrlParser:true});


const itemSchema = {
  name: String
};

const Item = mongoose.model("Items",itemSchema);

const item1 = new Item({
  name: "Welcome to your ToDo List 💕"
});

const item2 = new Item({
  name: "Hit the + button to add a new Task !"
});

const item3 = new Item({
  name: "<-- Hit this to delete a Task !"
});

const defaultItems = [item1,item2,item3];

// customList Page schema

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/",function(req,res){
  Item.find({}, function(err,foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully inserted items into database!");
        }
      });
      res.redirect("/");
    }else{
        res.render("list", {listTitle: "Today", ItemLists: foundItems});
    }
  });
});

app.get("/:customPage",function(req,res){
  const parameterList = _.capitalize(req.params.customPage);
  // console.log(parameterlist);
  List.findOne({name: parameterList}, function(err, foundListDoc){
    if(!err){
      if(!foundListDoc){
        // create a new list
        const list = new List({
          name: parameterList,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+parameterList);
      }else{
      // show existing list
        res.render("list", {listTitle: foundListDoc.name, ItemLists: foundListDoc.items});
      }
    }
  });
});


app.post("/", function(req,res){
  //console.log(req.body);
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundListDoc){
      foundListDoc.items.push(item);
      foundListDoc.save();
      res.redirect("/"+listName);
    });
  }
});

app.post("/delete",function(req,res){
  //console.log(req.body.checkbox);
  const item_id = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.deleteOne({_id: item_id},function(err){ // Item.findByIdAndRemove(id,function(err))
      if(err){
        console.log(err);
      }else{
        console.log("Successfully deleted the item");
      }
      res.redirect("/");
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: item_id}}}, function(err,foundListDoc){
      if(!err){
        res.redirect("/"+listName);
      }
    })
  }
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}
app.listen(port,function(){
  console.log("server has started Successfully");
});
