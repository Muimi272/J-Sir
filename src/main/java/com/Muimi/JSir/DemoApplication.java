package com.Muimi.JSir;

import com.Muimi.JSir.utils.ConfigUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.awt.*;
import java.util.*;
import java.util.List;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        ConfigUtil.applyAiConfig();
        SpringApplication.run(DemoApplication.class, args);
        String url = "http://localhost:10101/";
        try {
            String os = System.getProperty("os.name").toLowerCase();
            List<String> command;
            if (os.contains("win")) command = Arrays.asList("rundll32", "url.dll,FileProtocolHandler", url);
            else if (os.contains("mac")) command = Arrays.asList("open", url);
            else if (os.contains("nix") || os.contains("nux")) command = Arrays.asList("xdg-open", url);
            else {
                System.err.println("无法识别的操作系统，请手动访问：" + url);
                return;
            }
            new ProcessBuilder(command)
                    .start();
        } catch (Exception e) {
            System.err.println("自动打开浏览器失败，请手动访问：" + url);
        }
    }

}
