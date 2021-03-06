import express from 'express';
import { json } from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import ip from 'ip';
import generate from 'adjective-adjective-animal';
import configs from './configs';
import roomManager from './services/roomManager';

const app = express();
app.use(morgan('combined'));
app.use(json());
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:80',
  'http://localhost',
  'https://www.tonkatsusoba.com',
];

app.use(cors({
  origin(origin, callback) {
    // allow requests with no origin
    // (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not '
                + 'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
}));

function getWsUrl(id) {
  return `ws://${ip.address()}:${configs.port}/${id}`;
}

function generateUsername() {
  return new Promise(async (resolve, reject) => {
    await generate({ adjectives: 1, format: 'pascal' })
      .then(data => resolve(data))
      .catch(error => reject(error));
  });
}

// creates a room
app.get('/room/new', (req, res) => {
  roomManager.createNewRoom()
    .then(id => res.send({ id, url: getWsUrl(id) }));
});

// gets list of all the rooms
app.get('/rooms', (req, res) => {
  res.send({ rooms: Object.keys(roomManager.rooms) });
});

// checks if room exists
app.get('/room/has/:id', (req, res) => {
  const exists = roomManager.rooms[req.params.id];
  res.send({ exists });
});

// gets room message history
app.get('/room/:id/history', (req, res) => {
  res.send({ history: roomManager.rooms[req.params.id].history });
});

// creates a username
// TODO: Verify username is unique
app.get('/username/new', async (req, res) => {
  const username = await generateUsername();
  res.send({ username });
});

// we should deprecate this
app.get('/room/:roomId/user/:userId', (req, res) => {
  const users = roomManager.getUsersByRoomId(req.params.roomId);
  const userExists = Object.prototype.hasOwnProperty.call(users, req.params.userId);
  res.send({ userExists });
});

export default app;
