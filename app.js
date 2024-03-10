import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { promises as fs } from "fs";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = "live_s0HEZxHmyvbYhMLvtlI26KOHISNDrIQXlNa9WUZQNboA9MCFhNsE9LLYUKDfhZ7n"

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index");
});



app.get("/viewImages", async (req, res) => {
        const filePath = join(__dirname, "data.json");
        const data = await fs.readFile(filePath, 'utf8');
        const items = JSON.parse(data);
        res.render('viewImages', { items });
});

app.get("/fetch", async (req, res) => {

    const filePath = join(__dirname, "data.json");

    try {
        const data = await fs.readFile(filePath, 'utf8');
        const items = JSON.parse(data);
        res.render('viewImages', { items });
    } catch (readError) {
        if (readError.code === 'ENOENT') {
            try {
                const config = {
                    headers: {
                        'x-api-key': API_KEY
                    }
                };
                const response = await axios.get('https://api.thecatapi.com/v1/images/search?limit=20', config);
                let content = response.data;
                
                await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8');
                console.log('File created successfully');
                res.redirect('/viewImages');
            } catch (writeError) {
                console.error('Error creating file:', writeError);
                res.status(500).send('Error creating file');
            }
        } else {
            console.error('Error reading the file:', readError);
            res.status(500).send('Unable to read data file.');
        }
    }
});

app.get('/delete-image/:index', async (req, res) => {
    const index = req.params.index;
    const filePath = join(__dirname, "data.json");
    const data = await fs.readFile(filePath, 'utf8');
    const items = JSON.parse(data);

    items.splice(index, 1);
    await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf8');

    res.redirect('/');
});

app.get('/add-image', (req, res) => {
    res.render('addImage');
});


app.post('/add-image', async (req, res) => {
    const newUrl = req.body.url;
    const newName = req.body.name;
    const newDescription = req.body.description;
    const filePath = join(__dirname, "data.json");

    try {
    
        const data = await fs.readFile(filePath, 'utf8');
        const items = JSON.parse(data);

    
        items.push({
            url: newUrl,
            name: newName,
            description: newDescription
        });

        await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf8');

        res.redirect('/');
    } catch (error) {
        console.error('Error adding image:', error);
        res.status(500).send('Error adding image');
    }
});

app.get('/edit-image/:index', async (req, res) => {
    const index = req.params.index;
    const filePath = join(__dirname, "data.json");
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const items = JSON.parse(data);
        if (index >= 0 && index < items.length) {
            res.render('editImages', { item: items[index], index: index });
        } else {
            res.status(404).send('Image not found.');
        }
    } catch (error) {
        console.error('Error reading the file:', error);
        res.status(500).send('Unable to read data file.');
    }
});

app.post('/update-image/:index', async (req, res) => {
    const { index } = req.params;
    const { url, name, description } = req.body;
    const filePath = join(__dirname, "data.json");

    try {
        const data = await fs.readFile(filePath, 'utf8');
        const items = JSON.parse(data);

        if (items[index]) {
            items[index] = { url, name, description };
            await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf8');
            res.redirect('/'); 
        } else {
            res.status(404).send('Image not found.');
        }
    } catch (error) {
        console.error('Error updating the image:', error);
        res.status(500).send('Unable to update the image.');
    }
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
