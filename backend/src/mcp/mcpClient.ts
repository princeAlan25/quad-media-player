import dotenv from "dotenv";
dotenv.config();
import { Response, Request } from 'express';
import { OpenRouter } from '@openrouter/sdk';
import { Message, ToolDefinitionJson } from '@openrouter/sdk/esm/models';
import { AudioTools } from "./tools";
import { IAudioItem } from "../Interfaces/IAudioItem";

const openRouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY as string,
})

//run the agent
export async function llmClientAgent(req: Request, res: Response, functionalToolsDescriptions: ToolDefinitionJson[], llmGuidancePrompts: Message[], audioSource: IAudioItem[]) {
    const prompt = req.body.message;
    //collect all LLM context prompts guidance messages
    const llmGuidanceMessage: Message[] = [{ role: "user", content: prompt }];
    llmGuidanceMessage.push(...llmGuidancePrompts);

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        //send request to the LLM
        const response = await openRouter.chat.send({
            model: "google/gemma-4-26b-a4b-it:free", //model version
            messages: llmGuidanceMessage,
            tools: functionalToolsDescriptions
        });

        let audioItem: IAudioItem | null = null;

        //specifying the tool type to be used as must
        type ToolNameType = keyof typeof AudioTools;

        //send assistant message for tools usage
        const assistantMessage = response.choices[0]?.message;
        if (!assistantMessage?.toolCalls) {
            return res.json(assistantMessage?.content);
        }
        llmGuidanceMessage.push(assistantMessage);
        for (const call of assistantMessage.toolCalls) {
            const toolName = call.function.name;
            const args = JSON.parse(call.function.arguments);
            if (toolName in AudioTools) {
                const functionTool = AudioTools[toolName as ToolNameType];
                const audioResult = await functionTool(args, audioSource) as unknown;
                const res = audioResult as IAudioItem;
                audioItem = res;
                llmGuidanceMessage.push({
                    role: "tool",
                    toolCallId: call.id,
                    content: JSON.stringify(res)
                });
            }
        }

        //prepare LLM response back to the user
        const llmResponse = await openRouter.chat.send({
            model: "google/gemma-4-26b-a4b-it:free",
            messages: llmGuidanceMessage,
            tools: [],
            toolChoice: "none",
        });

        //send response
        const assistantMesage = llmResponse.choices[0]?.message.content;
        res.json(audioItem);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get a response from the AI model' });
    }
}