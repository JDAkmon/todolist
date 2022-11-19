//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const _ = require("lodash");

const mongoose = require('mongoose');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin-jordan:test123@atlascluster.gmp4hft.mongodb.net/todolistDB');

const itemsSchema = new mongoose.Schema({
  name: String
});

//Item is the model name when following any documentation
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Here is your todolist"
});

const item2 = new Item({
  name: "Press + to add a new item"
});

const item3 = new Item({
  name: "<-- To delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};
// Always use singular form here
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Added default items")
        }
      });
      // The code will end after adding the items so it has to be "refreshed"
      res.redirect("/");
    } else {
      //EJS VAR: Actual VAR that points to the data
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem.trim();
  const listName = req.body.list.trim();

  const item = new Item({
    name: itemName
  });
  //Default listName is always Today
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  } //end else

}); //end post

app.post("/delete", (req, res) => {
  const checkedItemID = req.body.checkbox.trim();
  const listName = req.body.listName;
  //Default list is Today
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted items")
        res.redirect("/");
      }
    });
  } else {
    //What list, what do you want to do, the callback
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemID
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }



});


app.get("/:CustomListName", (req, res) => {
  const CustomListName = _.capitalize(req.params.CustomListName);

  List.findOne({
    name: CustomListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        console.log("Does not exist");
        const list = new List({
          name: CustomListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + CustomListName);
      } else {
        console.log("Exist");
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    }
  });



}); //end of customlist name get req

app.get("/about", function(req, res) {
  res.render("about");
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
