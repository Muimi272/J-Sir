package com.Muimi.JSir.utils;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public final class ConfigUtil {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String CONFIG_FILE_NAME = "config.json";
    private static final Path CONFIG_FILE_PATH = Paths.get(CONFIG_FILE_NAME).toAbsolutePath();

    private ConfigUtil() {
    }

    public static AppConfig readConfig() {
        if (!Files.exists(CONFIG_FILE_PATH)) {
            throw new IllegalStateException("Missing config file: " + CONFIG_FILE_PATH);
        }

        try {
            return OBJECT_MAPPER.readValue(CONFIG_FILE_PATH.toFile(), AppConfig.class);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read config file: " + CONFIG_FILE_PATH, e);
        }
    }

    public static void applyAiConfig() {
        AppConfig appConfig = readConfig();
        if (appConfig == null || appConfig.ai == null) {
            throw new IllegalStateException("Invalid AI config in " + CONFIG_FILE_PATH);
        }

        setIfPresent("spring.ai.model.embedding", "none");
        setIfPresent("spring.ai.model.audio.transcription", "none");
        setIfPresent("spring.ai.model.audio.speech", "none");
        setIfPresent("spring.ai.model.image", "none");
        setIfPresent("spring.ai.model.moderation", "none");

        if (hasText(appConfig.ai.zhipuai != null ? appConfig.ai.zhipuai.apiKey : null)) {
            applyZhipuAiConfig(appConfig.ai.zhipuai);
            return;
        }

        if (hasText(appConfig.ai.openai != null ? appConfig.ai.openai.apiKey : null)) {
            applyOpenAiConfig(appConfig.ai.openai);
            return;
        }

        throw new IllegalStateException("No valid ai.openai or ai.zhipuai config found in " + CONFIG_FILE_PATH);
    }

    private static void applyOpenAiConfig(OpenAiConfig openAi) {
        setIfPresent("spring.ai.model.chat", "openai");
        setIfPresent("spring.ai.openai.api-key", openAi.apiKey);
        setIfPresent("spring.ai.openai.base-url", openAi.baseUrl);
        setIfPresent("spring.ai.openai.chat.options.model", openAi.model);
    }

    private static void applyZhipuAiConfig(ZhipuAiConfig zhipuAi) {
        setIfPresent("spring.ai.model.chat", "zhipuai");
        setIfPresent("spring.ai.zhipuai.api-key", zhipuAi.apiKey);
        setIfPresent("spring.ai.zhipuai.chat.options.model", zhipuAi.model);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static void setIfPresent(String key, String value) {
        if (value != null && !value.isBlank()) {
            System.setProperty(key, value);
        }
    }

    public static class AppConfig {
        public AiConfig ai;
    }

    public static class AiConfig {
        public OpenAiConfig openai;
        public ZhipuAiConfig zhipuai;
    }

    public static class OpenAiConfig {
        public String apiKey;
        public String baseUrl;
        public String model;
    }

    public static class ZhipuAiConfig {
        public String apiKey;
        public String model;
    }
}

