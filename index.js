// index.js

/**
 * Required External Modules
 */
const express = require("express");
const path = require("path");
var db = require("./database.js");
const bodyParser = require('body-parser');
const Diff = require('diff');
const Diff2html = require('diff2html');
const { v4: uuidv4 } = require('uuid');
var FlexSearch = require("flexsearch");
uuidv4();
/**
 * App Variables
 */

const app = express();
const port = process.env.PORT || "8000";

/**
 *  App Configuration
 */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Routes Definitions
 */
app.get("/add_page", (req, res) => {
  res.render("add_Page", {title: "Creating Page"});
});
app.post("/new_page", (req, res) => {
  var page_info = req.body.title_info;
  page_info = page_info.trim();
  page_info = page_info.replace(/ /g,"_");
  res.redirect('/page/'+ page_info);
});
app.get("/list_of_pages", (req, res) => {
  var title_list = [];
  var page_list = [];
  var sql = "select max(id), title, page from post group by page";
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    if (rows.length == 0) {
      res.render("pages_list", { title: "List of Wiki Pages", bool_value: false});
    }
    else {
      rows.forEach((row) => {
        if (row.title.trim() == ""){
          row.title = "Untitled Page"
        }
        title_list.push({title: row.title});
        page_list.push({page_path: row.page});
      });
      res.render("pages_list", {title: "List of Wiki Pages", page_list, title_list, bool_value: true});
    }
  });
});
app.get("/page/:id", (req, res) => {
  var sql = "select md_edit,title, change_description from post where id = (select max(id) from post where page ='" + req.params.id + "')";
  main_titleobj = {};
  main_page_content = {};
  var hljs = require('highlight.js');
  var md = require('markdown-it')({
    html: true,   
    linkify: true,  
    typographer: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return '<pre class="hljs"><code>' +
                 hljs.highlight(lang, str, true).value +
                 '</code></pre>';
        } catch (__) {}
      }
      return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    },
  });
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    if (rows.length == 0) {
      page_title = req.params.id;
      page_title = page_title.replace(/_/g, ' ');
      var start_letter = page_title[0].toUpperCase();
      page_title = start_letter + page_title.slice(1);
      for (var i = 0; i < page_title.length; i++) {
        if (page_title[i] === " ") {
          start_letter = page_title[i+1].toUpperCase();
          page_title = page_title.slice(0,i+1) + start_letter + page_title.slice(i+2)
        }
      }
      res.render("index", { title: "CodePages - " + page_title ,id: req.params.id, bool_value: false, page_title});
    }
    rows.forEach((row) => {
      row.md_edit = md.render(row.md_edit);
      main_titleobj = {title: row.title}
      main_page_content = {content: row.md_edit}
      res.render("index", { title: "CodePages - " + row.title, main_titleobj, main_page_content, id: req.params.id, bool_value: true});
    });
  });
});

app.post("/page/:id", (req, res) => {
  const title = req.body.title_info;
  const change_info = req.body.change_info;
  const html_data = req.body.data;
  var d = new Date();
  var time_string;
  if (d.getHours() >= 12 && d.getHours() != 24) {
    time_string = d.toLocaleDateString() + ", " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + " PM";
  }
  else{
    time_string = d.toLocaleDateString() + ", " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + " AM";
  }
  var insert = 'INSERT OR IGNORE INTO post (page, title, change_description, md_edit, edit_time) VALUES (?,?,?,?,?)';
  db.run(insert, [req.params.id, title, change_info, html_data, time_string])
  res.redirect('/page/'+ req.params.id);
});

app.get("/page/:id/edit", (req, res) => {
  var sql = "select md_edit,title, change_description from post where id = (select max(id) from post where page ='" + req.params.id + "')";
  main_titleobj = {}
  main_page_content = {}
  main_changelog = {}
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    if (rows.length == 0) {
      res.render("edit_page", {title: "CodePages - " + req.params.id, id:req.params.id, bool_value: false });
    }
    rows.forEach((row) => {
      main_titleobj = {title: row.title}
      main_page_content = {content: row.md_edit}
      main_changelog = {change_info: row.change_description}
      res.render("edit_page", {title: "CodePages - " + row.title, id:req.params.id, main_page_content, main_changelog, main_titleobj});
    });
  });
});
app.get("/page/:id/history", (req, res) => {
  var sql = "select title, change_description, edit_time, md_edit from post where page ='" + req.params.id + "'";
  var title_list = [];
  var change_list = [];
  var time_list = [];
  var content_list = [];
  var unique_id = uuidv4();
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    rows.forEach((row) => {
      if (row.change_description.length === 0){
        row.change_description = "No Changelog entry"
      }
      title_list.unshift({title: row.title});
      change_list.unshift({change_info: row.change_description});
      content_list.unshift({content: row.md_edit});
      time_list.unshift({creation_time: row.edit_time})
    });
    res.render("view_history", {title: "CodePages - " + title_list[0].title + " - History", title_list, id:req.params.id, change_list, time_list, content_list, unique_id});
  });
});
app.get("/page/:id/history/:unique_id/diff", (req, res) => {
  var index_edit = req.query.number_val;
  var length_val = req.query.length;
  var sql = "select title, edit_time, md_edit from post where page ='" + req.params.id + "'";
  var title_list = [];
  var time_list = [];
  var content_list = [];
  var original;
  var new_edit;
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    rows.forEach((row) => {
      title_list.unshift({title: row.title});
      content_list.unshift({content: row.md_edit});
      time_list.unshift({creation_time: row.edit_time})
    });
    var diff = "";
    index_edit = parseInt(index_edit);
    if (length_val === '1') {
      new_edit = content_list[index_edit];
      diff = Diff.createTwoFilesPatch(title_list[index_edit].title, title_list[index_edit].title, "", new_edit.content);
    }
    else {
      if (index_edit === content_list.length-1) {
        new_edit = content_list[index_edit];
        diff = Diff.createTwoFilesPatch(title_list[index_edit].title, title_list[index_edit].title, "", new_edit.content);
      }
      else {
        original = content_list[index_edit+1];
        new_edit = content_list[index_edit];
        diff = Diff.createTwoFilesPatch(title_list[index_edit].title, title_list[index_edit].title, original.content, new_edit.content);
      }
    }
    const diffJson = Diff2html.parse(diff);
    const diffHtml = Diff2html.html(diffJson, { drawFileList: true, outputFormat: 'side-by-side' });
    res.render("graphical_diff", {title: "CodePages - " + title_list[0].title + " - Diff" , original, diffHtml, time_list, index_edit});
  });
});
app.get("/search", (req, res) => {
  var search_info = req.query.q;
  var title_list = [];
  var time_list = [];
  var page_list = [];
  var content_list = [];
  var sql = "select max(id), edit_time, title, page, md_edit from post group by page";
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    if (rows.length == 0) {
      res.render("search_page", { title: "Search Results: " + search_info, bool_val: false});
    }
    else {
      rows.forEach((row) => {
        title_list.push({title: row.title});
        time_list.push({last_update: row.edit_time});
        page_list.push({page_path: row.page});
        content_list.push({content: row.md_edit})
      });
      var index = new FlexSearch();
      for (var i=0; i<title_list.length;i++) {
        index.add(i, content_list[i].content);
      }
      var response = index.search(search_info);
      res.render("search_page", {title: "Search Results: " + search_info, time_list, page_list, title_list, content_list, bool_val: true, response});
    }
  });
});
/**
 * Server Activation
 */
app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});