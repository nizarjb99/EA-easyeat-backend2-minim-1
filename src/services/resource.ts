import { ResourceModel, IResourceItem } from '../models/resource';

const createLink = async (restaurant_id: string, linkData: IResourceItem) => {

    let resource = await ResourceModel.findOne({ restaurant_id });
    
    if (!resource) {
        resource = new ResourceModel({
            restaurant_id,
            links: [linkData]
        });
        return await resource.save();
    } else {
        resource.links.push(linkData);
        return await resource.save();
    }
};


const getLinks = async (restaurant_id: string) => {
    const resource = await ResourceModel.findOne({ restaurant_id });
    if (!resource || !resource.links) return [];

    return resource.links;
};


const updateLink = async (restaurant_id: string, linkId: string, linkData: Partial<IResourceItem>) => {
    return await ResourceModel.findOneAndUpdate(
        { restaurant_id, "links._id": linkId },
        { 
            $set: { 
                "links.$.url": linkData.url, 
                "links.$.type": linkData.type, 
                "links.$.description": linkData.description 
            } 
        },
        { new: true }
    );
};

const deleteLink = async (restaurant_id: string, linkId: string) => {
    return await ResourceModel.findOneAndUpdate(
        { restaurant_id },
        { $pull: { links: { _id: linkId } } },
        { new: true }
    );
};

export default { createLink, getLinks, updateLink, deleteLink };

