package com.Muimi.JSir.tools;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

public class LearningProgressTool {
    private final static String PROGRESS_FILE_NAME = "progress.json";
    private final static Path PROGRESS_FILE_PATH = Paths.get(PROGRESS_FILE_NAME);
    private final static ObjectMapper mapper = new ObjectMapper();

    private static List<LearningProgress> progressList;

    @Tool(description = "获取学习进度，返回曾经交流中所涉及的所有知识点内容")
    public String getLearningProgress() {
        return progressList.isEmpty() ? "No learning progress recorded." :
                "Learning Progress:\n" + String.join("\n", progressList.stream()
                                                           .map(p -> "- " + p.knowledgePoint)
                                                           .toArray(String[]::new));
    }

    @Tool(description = "添加学习进度，输入本次交流所涉及知识点内容")
    public void addProgressList(@ToolParam(description = "需要记录的知识点内容")String knowledgePoint) {
        LearningProgress progress = new LearningProgress(knowledgePoint);
        try {
            progressList.add(progress);
            mapper.writerWithDefaultPrettyPrinter().writeValue(PROGRESS_FILE_PATH.toFile(), progressList);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write progress to file: " + PROGRESS_FILE_PATH, e);
        }
    }

    public static void readLearningProgress() {
        if (!Files.exists(PROGRESS_FILE_PATH)) {
            try {
                Files.createFile(PROGRESS_FILE_PATH);
            } catch (IOException e) {
                throw new RuntimeException("Failed to create progress file: " + PROGRESS_FILE_PATH, e);
            }
        }
        try {
            progressList = mapper.readValue(PROGRESS_FILE_PATH.toFile(), new TypeReference<List<LearningProgress>>() {
            });
        } catch (Exception e) {
            progressList = new ArrayList<>();
        }
    }

    public static class LearningProgress {
        public String knowledgePoint;

        public LearningProgress(String knowledgePoint) {
            this.knowledgePoint = knowledgePoint;
        }
    }
}
