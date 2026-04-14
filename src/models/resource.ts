import { Schema, model, Types } from 'mongoose';

export interface IResourceItem {
    _id?: Types.ObjectId;
    url: string;
    type: string; 
    description: string;
}

export interface IResource {
    _id?: Types.ObjectId;
    restaurant_id: Types.ObjectId;
    links: IResourceItem[];
}

const ResourceItemSchema = new Schema<IResourceItem>({
    url: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true }
});

const resourceSchema = new Schema<IResource>(
    {
        restaurant_id: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true },
        links: [ResourceItemSchema]
    },
    { timestamps: true, versionKey: false }
);

export const ResourceModel = model<IResource>('Resource', resourceSchema);
