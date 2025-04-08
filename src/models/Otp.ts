import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/config/db";

// Define Otp Attributes
interface OtpAttributes {
  id: number;
  email: string;
  otp: string;
  purpose: "register" | "forget";
  otpExpiry: Date;
  attempts: number;
  lastRequestTime?: Date | null;
}

// Use `Optional` to make some attributes optional
type OtpCreationAttributes = Optional<
  OtpAttributes,
  "id" | "attempts" | "lastRequestTime"
>;

// Define Otp Model
class Otp extends Model<OtpAttributes, OtpCreationAttributes> {
  declare id: number;
  declare email: string;
  declare otp: string;
  declare purpose: "register" | "forget";
  declare otpExpiry: Date;
  declare attempts: number;
  declare lastRequestTime: Date | null;
}

// Initialize Model
Otp.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Please enter a valid email address!",
        },
      },
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    purpose: {
      type: DataTypes.ENUM("register", "forget"),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please select a purpose!",
        },
      },
    },
    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastRequestTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "otp",
    timestamps: true,
  }
);

export default Otp;
