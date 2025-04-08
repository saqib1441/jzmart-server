import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "@/config/db";

// Define Auth Model Attributes
interface AuthAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "seller";
  createdAt?: Date;
  updatedAt?: Date;
}

// Define Optional Attributes for Creation
type AuthCreationAttributes = Optional<
  AuthAttributes,
  "id" | "createdAt" | "updatedAt"
>;

// Define Auth Model with TypeScript
class Auth
  extends Model<AuthAttributes, AuthCreationAttributes>
  implements AuthAttributes
{
  declare id: number;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: "user" | "admin" | "seller";

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Initialize Model
Auth.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please enter your name!",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Please enter a valid email address!",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Please enter a password!",
        },
      },
    },
    role: {
      type: DataTypes.ENUM("user", "admin", "seller"),
      allowNull: false,
      defaultValue: "user",
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withPassword: {
        attributes: {
          include: ["password"],
        },
      },
    },
  }
);

export default Auth;
