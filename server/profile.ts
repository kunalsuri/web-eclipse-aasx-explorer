import { Express, Request } from "express";
import express from "express";
import multer from "multer";
import { storage } from "./storage";
import { PublicUser } from "@shared/schema";
import { validateAccessToken } from "./auth/auth-middleware";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = 'uploads/profile-pictures';
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${req.jwtUser?.userId}_${Date.now()}${ext}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
});

export function setupProfile(app: Express) {
  
  // Get user profile
  app.get("/api/profile", validateAccessToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.jwtUser!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...publicUser } = user;
      res.json(publicUser);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user profile
  app.put("/api/profile", validateAccessToken, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.jwtUser!.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const validatedData = profileUpdateSchema.parse(req.body);
      
      // Check if email is already taken by another user
      if (validatedData.email && validatedData.email !== currentUser.email) {
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser && existingUser.id !== currentUser.id) {
          return res.status(400).json({ message: "Email already taken" });
        }
      }

      const updatedUser = await storage.updateUser(currentUser.id, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...publicUser } = updatedUser;
      res.json(publicUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Upload profile picture (with auth guard before multer)
  app.post("/api/profile/upload-picture", validateAccessToken, async (req, res, next) => {
    // Now proceed with multer
    upload.single('profilePicture')(req, res, next);
  }, async (req, res) => {
    try {
      const user = await storage.getUser(req.jwtUser!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Delete old profile picture if exists
      if (user.profilePicture) {
        try {
          await fs.unlink(user.profilePicture);
        } catch (error: any) {
          // Log but don't fail if file doesn't exist
          if (error.code !== 'ENOENT') {
            console.error("Failed to delete old profile picture:", error);
          }
        }
      }

      const profilePicturePath = req.file.path;
      const updatedUser = await storage.updateUser(user.id, { 
        profilePicture: profilePicturePath 
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ profilePicture: profilePicturePath });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete user account
  app.delete("/api/profile", validateAccessToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.jwtUser!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete profile picture if exists
      if (user.profilePicture) {
        try {
          await fs.unlink(user.profilePicture);
        } catch (error) {
          // Ignore if file doesn't exist
        }
      }

      await storage.deleteUser(user.id);
      
      // Revoke all user sessions
      if (req.sessionId) {
        const { sessionManager } = await import('./auth/session-manager');
        await sessionManager.revokeSession(req.sessionId);
      }
      
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user preferences
  app.get("/api/profile/preferences", validateAccessToken, async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.jwtUser!.userId);
      res.json(preferences);
    } catch (error) {
      console.error("Get preferences error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user preferences
  app.put("/api/profile/preferences", validateAccessToken, async (req, res) => {
    try {
      const preferences = await storage.updateUserPreferences(req.jwtUser!.userId, req.body);
      res.json(preferences);
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Serve uploaded profile pictures
  app.use('/uploads', express.static('uploads'));
}