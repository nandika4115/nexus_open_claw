import fs from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
export class LlmClient {
    config;
    logger;
    anthropic;
    openai;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        if (config.anthropicApiKey) {
            this.anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
        }
        if (config.openaiApiKey) {
            this.openai = new OpenAI({ apiKey: config.openaiApiKey });
        }
    }
    async generate(request) {
        const prompt = await this.loadPrompt(request.promptName, request.variables);
        const context = request.contextChunks.join("\n\n");
        const content = `${prompt}\n\n${context}`.trim();
        try {
            return await this.invokeProvider(this.config.primary, content);
        }
        catch (error) {
            this.logger.warn("Primary LLM failed, falling back", { error: error.message });
            return await this.invokeProvider(this.config.fallback, content);
        }
    }
    async invokeProvider(provider, content) {
        if (provider === "claude") {
            if (!this.anthropic) {
                throw new Error("Anthropic API key not configured");
            }
            const response = await this.anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: this.config.maxOutputTokens,
                temperature: this.config.temperature,
                messages: [{ role: "user", content }]
            });
            const message = response.content[0];
            if (!message || message.type !== "text") {
                throw new Error("Claude response missing text");
            }
            return message.text;
        }
        if (provider === "openai") {
            if (!this.openai) {
                throw new Error("OpenAI API key not configured");
            }
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                max_tokens: this.config.maxOutputTokens,
                temperature: this.config.temperature,
                messages: [{ role: "user", content }]
            });
            return response.choices[0]?.message?.content ?? "";
        }
        throw new Error("Local LLM provider not configured");
    }
    async loadPrompt(promptName, variables) {
        const filePath = path.join(this.config.promptsPath, `${promptName}.md`);
        const template = await fs.readFile(filePath, "utf8");
        return Object.entries(variables).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, value), template);
    }
}
