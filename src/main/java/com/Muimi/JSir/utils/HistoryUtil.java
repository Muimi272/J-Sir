package com.Muimi.JSir.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

public final class HistoryUtil {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Path HISTORY_FILE = Paths.get("chat-history.json");
    private static final int MAX_ROUNDS = 20;
    private static final int MAX_MESSAGES = MAX_ROUNDS * 2;

    private HistoryUtil() {
    }

    public static synchronized List<HistoryMessage> readHistory() {
        if (!Files.exists(HISTORY_FILE)) {
            return new ArrayList<>();
        }

        try {
            return OBJECT_MAPPER.readValue(
                    HISTORY_FILE.toFile(),
                    new TypeReference<List<HistoryMessage>>() {
                    }
            );
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    public static synchronized void writeHistory(String userMessage, String assistantMessage) {
        List<HistoryMessage> history = readHistory();

        history.add(new HistoryMessage("user", userMessage));
        history.add(new HistoryMessage("assistant", assistantMessage));

        if (history.size() > MAX_MESSAGES) {
            history = new ArrayList<>(history.subList(history.size() - MAX_MESSAGES, history.size()));
        }

        try {
            OBJECT_MAPPER.writerWithDefaultPrettyPrinter().writeValue(HISTORY_FILE.toFile(), history);
        } catch (IOException ignored) {
            // Ignore write failures to avoid interrupting chat responses.
        }
    }

    @Setter
    @Getter
    @NoArgsConstructor
    public static final class HistoryMessage {
        private String role;
        private String content;

        public HistoryMessage(String role, String content) {
            this.role = role;
            this.content = content;
        }

    }
}

