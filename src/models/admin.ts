import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export interface IAdmin extends Document {
    email: string;
    password?: string;
    name: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
    {
        name: { 
            type: String, 
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: { 
            type: String, 
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/.+@.+\..+/, 'Please provide a valid email address'],
        },
        password: { 
            type: String, 
            select: false,
            validate: {
                validator: (v: string) => PASSWORD_REGEX.test(v),
                message: 'Password must be at least 8 characters and contain at least one uppercase letter and one number',
            },
        }
    },
    { timestamps: true }
);

adminSchema.pre<IAdmin>('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

export const AdminModel = model<IAdmin>('Admin', adminSchema);
