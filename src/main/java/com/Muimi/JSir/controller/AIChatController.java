package com.Muimi.JSir.controller;

import com.Muimi.JSir.dto.ChatRequest;
import com.Muimi.JSir.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;


@Controller
@RequestMapping("/ai")
public class AIChatController {

    private final AIService aiService;

    @Autowired
    public AIChatController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    @ResponseBody
    public Flux<String> chat(@RequestBody ChatRequest request) {
        return aiService.streamChatWithMemory(request.getMsg());
    }
}
