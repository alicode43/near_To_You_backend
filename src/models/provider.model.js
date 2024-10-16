import mongoose, { Schema } from "mongoose";

const providerSchema = Schema({
    
}, { timestamp: true });

const Provider = mongoose.model("Provider", providerSchema);
