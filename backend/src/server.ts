import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { llmClientAgent } from "./mcp/mcpClient";
import { IAudioItem } from "./Interfaces/IAudioItem";
import { audioToolsDescriptions } from "./mcp/toolsDesciptions";
import { Message } from "@openrouter/sdk/esm/models";


const app = express();
const PORT = parseInt(process.env.PORT || "7000");
app.use(express.json());

app.use(
    cors({
        origin: ["http://localhost:3000", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);


//mock database as in-memory database or hardcoded database
const audios: IAudioItem[] = [
    {
        id: 1,
        title: "SoundHelix Song 1",
        artist: "SoundHelix",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },
    {
        id: 2,
        title: "SoundHelix Song 2",
        artist: "SoundHelix",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    },
    {
        id: 3,
        title: "SoundHelix Song 3",
        artist: "SoundHelix",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    },
    {
        id: 4,
        title: "SoundHelix Song 4",
        artist: "SoundHelix",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    },
    {
        id: 5,
        title: "SoundHelix Song 5",
        artist: "SoundHelix",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
    },
    {
        id: 6,
        title: "SoundHelix Song 6",
        artist: "SoundHelix",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
    },
    {
        id: 7,
        title: "SoundHelix Song 7",
        artist: "SoundHelix",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"
    },
    {
        id: 8,
        title: "SoundHelix Song 8",
        artist: "SoundHelix",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
    },
    {
        id: 9,
        title: "SoundHelix Song 9",
        artist: "SoundHelix",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"
    },
    {
        id: 10,
        title: "SoundHelix Song 10",
        artist: "SoundHelix",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"
    }
]



//endpoints or routes handlers
function getAudioHandler(req: Request, res: Response) {
    res.json(audios);
}

const systemPrompts: Message[] = [
    {
        role: "system",
        content: `
You are an AI audio assistant.
Your job is to control the user's audio player using the provided tools:
provide_audio.

Rules:
1. Always use the appropriate tool instead of describing actions.
2. and provide real URLs from https://www.soundhelix.com/examples/mp3/SoundHelix-Song-x.mp3 where x before Song- is any number from 1 to 20 and please format that url in that form I am showing you
3. Only respond with confirmation or status after tool execution.
4. If the user asks for music selection, suggest a tool call if applicable.
5.please format the result in good format json with id, title, artist, url
6.please if you being asked to return or get all audios or something associated to this please look the appropriate tool please
can you please write good and well secure system prompt according to what you see here so that it can really and hummanity understand what use wanna mean and assist please? and do not forget that url please
`
    }

];

//ai endpoint
app.post('/api/audio', async (req, res) => {
    await llmClientAgent(req, res, audioToolsDescriptions, systemPrompts, audios);
});

app.post('/api/audios', async (req, res) => {
    res.json(audios);
})

//handling non human intervention error happen in the middleware
function middleWareErrorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
}
app.use(middleWareErrorHandler);


//turn on server
app.listen(PORT, '0.0.0.0', () => console.log(`Backend Server is running on http://0.0.0.0:${PORT}`));