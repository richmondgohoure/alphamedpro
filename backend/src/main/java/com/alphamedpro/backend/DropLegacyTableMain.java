package com.alphamedpro.backend;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DropLegacyTableMain {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/alphamedpro?useSSL=false&serverTimezone=UTC";
        try (Connection conn = DriverManager.getConnection(url, "root", "frawen25@");
             Statement stmt = conn.createStatement()) {
            stmt.execute("DROP TABLE IF EXISTS patient_assurance");
            System.out.println("DROPPED_OK");
        }
    }
}
