import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
var aes256 = require('aes256');
import authMiddleware from './authMiddleware';

// I know, I know. environment variables. Will do fo sho
const JWT_SECRET = 'I have refined you, though not as silver; I have chosen you in the furnace of affliction.';
const permanentKey = crypto.scryptSync(JWT_SECRET, Date.now().toString(), 24);

const app = express();
const port = 3000;

app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public', {
  redirect: false
}))
app.use(authMiddleware(permanentKey)); // Use the authentication middleware
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '../views'));

// Read the images dir on startup so I don't have to read it on every API call
const imagePath = './public/images';
const imageDirectories: string[] = fs.readdirSync(imagePath);
const images: any = {};

for (const dir of imageDirectories) {
  images[dir] = fs.readdirSync(path.join(imagePath, dir));
}

app.get('/', (req: Request, res: Response) => {

  // we track the total number of spins required to fix all the images
  let correctSpins = 0;

  const randomImages: string[][] = [];

  for (let i = 0; i < 4; i++) {

    const imageNames = Object.keys(images);
    const seed = Math.random()*imageNames.length
    const index = Math.floor(seed)
    const randomImage = imageNames[index];
    const twist = Math.floor(Math.random() * 6);
    const twistedImage = images[randomImage][twist]
    correctSpins += (twist + 1) % 6;
    let imageSet: any[] = [];

    for (let i = 0; i < 50; i++) {
      imageSet.push(i)
    }

    imageSet = imageSet.map(i => {
      const index = (twist + i) % 6;
      const rawPath = `/images/${randomImage}/${twistedImage}`;
      const variations = rawPath.replace(/\d/, index.toString());
      return variations;
    });
    randomImages.push(imageSet);
  };
  const salt = Date.now().toString();
  const token = jwt.sign(`${aes256.encrypt(permanentKey.toString(), correctSpins.toString())}, ${salt}`, permanentKey);
  res.cookie('sleepycookie', token)
  res.render('main', { 'images': randomImages });
});

app.get('/unknown_visitor', (req: Request, res: Response) => {
  const filePath = path.join(__dirname, '..', 'public', 'cen-chan-master', 'frontend', 'index.html');
  res.sendFile(filePath)
});

app.get('/b/', (req: Request, res: Response) => {
  const filePath = path.join(__dirname, '..', 'public', 'cen-chan-master', 'frontend', 'b', 'index.html');
  res.sendFile(filePath)
});

app.get('/b/:threadId', (req: Request, res: Response) => {
  res.render('thread', { 'threadId': req.params.threadId });
});

app.post('/submit', (req: Request, res: Response) => {
  const sums = [0, 0, 0, 0];
  // TODO: a real form will have other stuff, so we need a special prefix for these
  for (const key of Object.keys(req.body)) {
    if (key.startsWith('sleepy')) {
      const whichImage = parseInt(key.split('-')[2])
      sums[whichImage] = (sums[whichImage] + 1) % 6;
    }
  }
  const attempt = sums.reduce((p, i) => p + i)
  const correct = parseInt(aes256.decrypt(
    permanentKey.toString(),
    jwt.decode(req.cookies.sleepycookie)?.split(',')[0]
  ));

  if (attempt !== correct) {
    res.redirect(req.get('Referer') + '?captcha=failed' || '/')
    return;
  }
  res.cookie('danit', jwt.sign(Date.now().toString(), permanentKey));
  res.redirect('/unknown_visitor');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});