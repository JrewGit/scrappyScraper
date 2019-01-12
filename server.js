const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const axios = require("axios");
const cheerio = require("cheerio");

const db = require("./models");

let PORT = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost/scrappyScrapper", {useNewUrlParser: true});

app.get("/scrape", function(req, res) {
    axios.get("http://www.tmz.com/").then(function(response) {
      const $ = cheerio.load(response.data);

      $("span.hf1").each(function(i, element) {
        let result = {};

        result.title = `${$(this).text()} ${$(this).next().text()} ${$(this).next().text()}`;
        result.link = $(this).parents("a").attr("href");

        db.Article.create(result)
          .then(function(dbArticle) {
            console.log(dbArticle);
          })
          .catch(function(err) {
            return res.json(err);
          });
      });

        res.send("Scrape Complete")
    });
});

app.get("/articles", function(req, res) {
    db.Article.find({})
    .then(function(dbArticle) {
        res.json(dbArticle)
        })
    .catch(function(err) {
        return res.json(err);
    })
});

app.get("/articles/:id", function(req, res) {
    db.Article.findOne({_id: req.params.id})
    .populate("note")
    .then(function(dbArticle) {
        res.json(dbArticle)
    })
    .catch(function(err) {
        res.json(err);
    })
});

app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
    .then(function(dbNote) {
        return db.Article.finOneAndUpdate({_id: req.params.id}, {note: dbNote._id}, {new: true});
    })
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.json(err);
    })
})

app.listen(PORT, function() {
    console.log(`App running on port http://localhost:${PORT}!`)
})