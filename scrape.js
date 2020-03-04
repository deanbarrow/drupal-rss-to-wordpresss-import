const Parser = require('rss-parser');
const parser = new Parser();
const axios = require("axios");
const cheerio = require('cheerio');
const sanitizeHtml = require('sanitize-html');
const Importer = require('wxr-generator');
const moment = require('moment');

const feedUrl = 'http://www.example.com/feed';
const siteUrl = 'http://www.example.com/';

const importer = new Importer({
    name: 'import',
    url: siteUrl,
    description: 'import',
    language: 'en-US',
    base_site_url: siteUrl,
    base_blog_url: siteUrl
  });

(async () => {

    const feed = await parser.parseURL(feedUrl);
   
    // If importing more than 10,000 posts then increase the randomNum() range to avoid overlapping ids
    // Also set high enough that you won't conflict with existing WP ids
    let i = 10000
    for(item of feed.items){
        // if(i===10002)
        //     break

            // console.log(`${i}: ${item.pubDate} - ${item.title} - ${item.link}`)
            const { data } = await axios.get(item.link);
            const $ = cheerio.load(data)

            let content = $('.field--name-body').html()
            content = sanitizeHtml(content)

            const summary = item.contentSnippet

            const title = item.title

            const slug = item.link.replace(siteUrl, '')

            const image = ($('.field--name-field-news-image img')[0]) ? $('.field--name-field-news-image img')[0].attribs.src : ''

            // Some pages have embedded videos, log to console to check later
            const iframe = ($('.field--name-body iframe')[0]) ? $('.field--name-body iframe')[0].attribs.src : ''
            if(iframe)
                console.log(`IFRAME ${item.pubDate} - ${item.title} - ${item.link}`)

            const date = moment(item.isoDate).format('YYYY-MM-DD HH:mm:ss')    

            const imageId = (image) ? randomNum() : ''

            importer.addPost({
                id: i,
                title,
                // url: item.link,
                slug,
                date,
                author: 'admin',
                content,
                summary,
                comment_status: 'closed',
                ping_status: 'closed', 
                // password: '',
                // categories: [{slug: 'life', name: 'Life'}, {slug: 'wp', name: 'wordpress'}],
                // tags: [{slug: 'blog', name: 'Blog'}]
                image: imageId
            }) 

            // If post has an image, set as featured wordpress image
            if(image){
                importer.addAttatchment({
                    id: imageId,
                    url: image,
                    date,
                    // file: "/wp-content/upload/2015/10/05/minka.jpg",
                    title,
                    author: 'admin',
                    // description: title, 
                    post_id: i
                })
            }

        i++
    }

    const xmlString = importer.stringify();
    require('fs').writeFile('export.xml', xmlString, function(err) {
    if (err) {
        console.log(err);
    }
    console.log("File saved")
    });
 
})();

// Random number between 20,000-30,000
const randomNum = function randomNum() {
    return Math.floor(Math.random() * 30000) + 20000;
};

