
import { getCloudinaryIdsFromContent, extractPublicIdFromUrl } from "../lib/utils/media-utils";

const sampleUrl = "https://res.cloudinary.com/dsxpwqmlw/image/upload/v1736158000/folder/sample-image.jpg";
console.log("Testing URL extraction:");
console.log(`URL: ${sampleUrl}`);
console.log(`Extracted ID: ${extractPublicIdFromUrl(sampleUrl)}`);

const sampleContent = {
    type: "doc",
    content: [
        {
            type: "resizableImage",
            attrs: {
                src: "https://res.cloudinary.com/dsxpwqmlw/image/upload/v1736158001/image1.png",
                width: "100%"
            }
        },
        {
            type: "attachment",
            attrs: {
                src: "https://res.cloudinary.com/dsxpwqmlw/image/upload/v1736158002/doc.pdf",
                name: "Document"
            }
        },
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "Link to image",
                    marks: [
                        {
                            type: "link",
                            attrs: {
                                href: "https://res.cloudinary.com/dsxpwqmlw/image/upload/v1736158003/linked-image.jpg"
                            }
                        }
                    ]
                }
            ]
        }
    ]
};

console.log("\nTesting Content Extraction:");
const ids = getCloudinaryIdsFromContent(sampleContent);
console.log("IDs found:", Array.from(ids));
