const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected for seeding...");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const plantSchema = new mongoose.Schema({
  plantName: String,
  price: Number,
  discount: Number,
  stock: Number,
  category: String,
  description: String,
  images: [
    {
      public_id: String,
      url: String,
    },
  ],
  imagesList: [
    {
      public_id: String,
      url: String,
    },
  ],
  noOfVisit: Number,
  postedAt: Date,
});

const Plant = mongoose.model("Plant", plantSchema);

const plants = [
  {
    plantName: "Rose Plant",
    price: 100,
    discount: 10,
    stock: 50,
    category: "Flower",
    description: "Beautiful red roses for your garden.",
    images: [{ public_id: "rose_1", url: "https://example.com/rose.jpg" }],
    imagesList: [{ public_id: "rose_list_1", url: "https://example.com/rose_list.jpg" }],
    noOfVisit: 0,
    postedAt: new Date(),
  },
  // Add more plants as needed...
];

const seedPlants = async () => {
  try {
    await connectDB();
    await Plant.deleteMany();
    await Plant.insertMany(plants);
    console.log("Plants seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedPlants();
