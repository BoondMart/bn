// const multer = require('multer');
// const path = require('path');

// const storageCategory = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, './public/category');
//   },
//   filename: function(req, file, cb) {
//     // Check file type based on its extension
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (extname) {
//       cb(null, Date.now() + "_" + Math.floor(Math.random() * 1000) + path.extname(file.originalname));
//     } else {
//       cb("Error: only .jpeg, .jpg, .png files are allowed!");
//     }
//   }
// });

// const uploadCategory = multer({
//   storage: storageCategory,
//   limits: {
//     fileSize: 1024 * 1024 * 5 // limit filesize to 5MB
//   },
// });

// const storageProduct = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, './public/products');
//   },
//   filename: function(req, file, cb) {
//     // Check file type based on its extension
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (extname) {
//       cb(null, Date.now() + "_" + file.originalname);
//     } else {
//       cb("Error: only .jpeg, .jpg, .png files are allowed!");
//     }
//   }
// });

// const uploadProduct = multer({
//   storage: storageProduct,
//   limits: {
//     fileSize: 1024 * 1024 * 5 // limit filesize to 5MB
//   },
// });


// const storagePoster = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, './public/posters');
//   },
//   filename: function(req, file, cb) {
//     // Check file type based on its extension
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (extname) {
//       cb(null, Date.now() + "_" + file.originalname);
//     } else {
//       cb("Error: only .jpeg, .jpg, .png files are allowed!");
//     }
//   }
// });

// const uploadPosters = multer({
//   storage: storagePoster,
//   limits: {
//     fileSize: 1024 * 1024 * 5 // limit filesize to 5MB
//   },
// });


// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './public/riders');
//   },
//   filename: (req, file, cb) => {
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
//     if (!extname) {
//       return cb(new Error('Only .jpeg, .jpg, and .png files are allowed'));
//     }
    
//     cb(null, `rider_${Date.now()}_${Math.floor(Math.random() * 1000)}${path.extname(file.originalname)}`);
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     const filetypes = /jpeg|jpg|png/;
//     const mimetype = filetypes.test(file.mimetype);
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (mimetype && extname) {
//       return cb(null, true);
//     }
//     cb(new Error('File upload only supports jpeg, jpg, and png'));
//   }
// });

// module.exports = {
//   uploadCategory,
//   uploadProduct,
//   uploadPosters,
//   upload
// };
// upload.js - Main file with shared AWS configuration



const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');

// AWS S3 configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Shared file type validation
const validateFileType = (file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only .jpeg, .jpg, .png files are allowed!'));
};

// Category upload configuration
const uploadCategory = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || 'your-bucket-name',
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      
      if (!extname) {
        return cb(new Error('Only .jpeg, .jpg, and .png files are allowed'));
      }
      
      cb(null, `category/${Date.now()}_${Math.floor(Math.random() * 1000)}${path.extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    validateFileType(file, cb);
  }
});

// Product upload configuration
const uploadProduct = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || 'your-bucket-name',
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      
      if (!extname) {
        return cb(new Error('Only .jpeg, .jpg, and .png files are allowed'));
      }
      
      cb(null, `products/${Date.now()}_${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    validateFileType(file, cb);
  }
});

// Poster upload configuration
const uploadPosters = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || 'your-bucket-name',
    acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      
      if (!extname) {
        return cb(new Error('Only .jpeg, .jpg, and .png files are allowed'));
      }
      
      cb(null, `posters/${Date.now()}_${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    validateFileType(file, cb);
  }
});

// Helper function to generate S3 URLs from stored object keys
const getS3Url = (objectKey) => {
  if (!objectKey) return null;
  
  const bucket = process.env.AWS_S3_BUCKET || 'your-bucket-name';
  const region = process.env.AWS_REGION || 'us-east-1';
  
  return `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;
};

// Helper function to delete files from S3
const deleteS3File = async (objectKey) => {
  if (!objectKey) return;
  
  try {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET || 'your-bucket-name',
      Key: objectKey
    };
    
    await s3.send(new DeleteObjectCommand(deleteParams));
    console.log(`Successfully deleted file from S3: ${objectKey}`);
  } catch (error) {
    console.error(`Error deleting file from S3: ${objectKey}`, error);
    throw error;
  }
};

module.exports = {
  uploadCategory,
  uploadProduct,
  uploadPosters,
  getS3Url,
  deleteS3File,
  s3 // Export s3 client for use in other modules
};