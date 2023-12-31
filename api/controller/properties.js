// Load Properies Model
const Property = require('../models/property');
const Subtenant = require("../models/subtenants");
const Completed = require('../models/completed');
const FBContacts = require('../models/fb_contacts');
const mongoose = require("mongoose");
const User = require("../models/user");
const jwt = require('jsonwebtoken');
const client = require('twilio')(process.env.TWILIO_ACC_SID, process.env.TWILIO_AUTH_TOKEN);


// ------------ Image Specific Code----------

const Grid = require('gridfs-stream');

const dbInstance = mongoose.connection;

let gfs, gridfsBucket;


dbInstance.once('open', () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(dbInstance.db, {
    bucketName: 'propertyImages'
  });

  gfs = Grid(dbInstance.db, mongoose.mongo);
  gfs.collection('propertyImages');
})


// //-----------Get an Image----------------
exports.get_image = async (req, res, next) => {
  const file = await gfs.files.findOne({ filename: req.params.filename });
  console.log("FILE", file)
  if(file !=null){
  const readstream = gridfsBucket.openDownloadStream(file._id);
  // var readstream = gfs.createReadStream({ filename: req.params.filename });
  readstream.on("error", function (err) {
    res.send("No image found with that title");
  });
  
  readstream.pipe(res);
}
}
//-----------Get an Image----------------
// exports.get_image = async (req, res, next) => {
//   await gfs.files.findOne({ filename: req.params.filename })
//   .then((response) =>{
//     console.log("response" , response);
//     gridfsBucket.openDownloadStream(response._id);
//   })
//   // var readstream = gfs.createReadStream({ filename: req.params.filename });
//   // readstream.on("error", function (err) {
//   //   res.send("No image found with that title");
//   // // });
//   // readstream.pipe(res);
// }




//************************* PROPERTY CONTROLLER ***************************//
// @route GET /properties
// @description lists all of the properties in the market
// @access public
exports.property_get_all = (req, res, next) => {
  Property.find()
    .then(proprties => res.json(proprties))
    .catch(err => res.status(404).json({ propertiesFound: 'none' }));

};

// @route GET /properties
// @description lists all of the properties in the market
// @access public
exports.property_query = (req, res, next) => {

  console.log("lat", req.query.latitude)
  console.log("long", req.query.longitude)
  console.log("maxdist", req.query.maxDistance)
  query = req.query
  
  //AVAILABILITY
  console.log("PROPERTTY QUERY", req.query)
  if(req.query.availableFrom != undefined){
    if(req.query.availableTo != undefined){
      console.log("SETTING AVAILABLE QUERY")
      const to = req.query.availableTo
      const from = req.query.availableFrom
      query.availableFrom ={"$lte": to}
      query.availableTo = {"$gte": from}
    } 
  }



  amens = []
  if(query.Pet_Friendly != undefined){
    amens.push('Pet_Friendly')
    delete query.Pet_Friendly
  }
  if(query.Garages != undefined){
    amens.push('Garages')
    delete query.Garages
  }
  if(query.Swimming_Pool != undefined){
    amens.push('Swimming_Pool')
    delete query.Swimming_Pool
  }
  if(query.Wifi != undefined){
    amens.push('Wifi')
    delete query.Wifi
  }
  if(query.Gym != undefined){
    amens.push('Gym')
    delete query.Gym
  }
  if(query.Washer_Dryer != undefined){
    amens.push('Washer_Dryer')
    delete query.Washer_Dryer
  }
  if(query.Gated_Access != undefined){
    amens.push('Gated_Access')
    delete query.Gated_Access
  }
  if(query.Public_Transportation != undefined){
    amens.push('Public_Transportation')
    delete query.Public_Transportation
  }
  if(query.Heating_Cooling != undefined){
    amens.push('Heating_Cooling')
    delete query.Heating_Cooling
  }
  if(query.Microwave != undefined){
    amens.push('Microwave')
    delete query.Microwave
  }
  if(query.Grill != undefined){
    amens.push('Grill')
    delete query.Grill
  }
  if(query.TV != undefined){
    amens.push('TV')
    delete query.TV
  }
  if(query.Fridge != undefined){
    amens.push('Fridge')
    delete query.Fridge
  }
  if(query.Couch != undefined){
    amens.push('Couch')
    delete query.Couch
  }
  if(query.Oven != undefined){
    amens.push('Oven')
    delete query.Oven
  }
  if(query.Mattress != undefined){
    amens.push('Mattress')
    delete query.Mattress
  }
  if(query.Coffee_Maker != undefined){
    amens.push('Coffee_Maker')
    delete query.Coffee_Maker
  }
  if(query.Toaster != undefined){
    amens.push('Toaster')
    delete query.Toaster
  }
  if(query.Dishes != undefined){
    amens.push('Dishes')
    delete query.Dishes
  }
  if(query.Pots_Pans != undefined){
    amens.push('Pots_Pans')
    delete query.Pots_Pans
  }
  if(query.Utilities_Included != undefined){
    amens.push('Utilities_Included')
    delete query.Utilities_Included
  }
  if(query.Walkin_Closet != undefined){
    amens.push('Walkin_Closet')
    delete query.Walkin_Closet
  }
  if(query.Iron != undefined){
    amens.push('Iron')
    delete query.Iron
  }
  if(query.Freezer != undefined){
    amens.push('Freezer')
    delete query.Freezer
  }
  if(query.Balcony != undefined){
    amens.push('Balcony')
    delete query.Balcony
  }
  if(query.Street_Parking != undefined){
    amens.push('Street_Parking')
    delete query.Street_Parking
  }
  if(query.Pet_FrParking_on_Premesisiendly != undefined){
    amens.push('Parking_on_Premesis')
    delete query.Parking_on_Premesis
  }
  
  if(amens.length != 0){

    query.amenities =  {
      $all: amens
    }
  }

  if (query.priceLow != undefined || query.priceHigh != undefined) {
    price = { $gte: req.query.priceLow, $lte: req.query.priceHigh }
    req.query.price = price
  }
  var coords = [];
  maxDistance = 1600 * 10;
  if (query.maxDistance != undefined) {
    maxDistance = query.maxDistance * 1600;
  }
  if (!(query.latitude == undefined && query.longitude == undefined)) {
    coords[0] = req.query.longitude;
    coords[1] = req.query.latitude;
    console.log(coords)
    query.loc = {
      $near:
      {
        $geometry: {
          type: "Point",
          coordinates: coords
        },
        $maxDistance: maxDistance
      }
    }

  }
  delete query.priceHigh
  delete query.priceLow
  delete query.latitude
  delete query.longitude
  delete query.maxDistance
  query.deleted = false
  console.log("QUERY", JSON.stringify(query))

  Property.find(query, null, { skip: req.query.page * 4, limit: 4 })
    .then( async properties => {
      console.log(properties)
      let arr = properties
      let i = 0;
      let props = await Promise.all(properties.map(async p => {
            if(p.postedBy != null){
              let d = await User.findById(p.postedBy).then(async user => {
              let q = p

              postedUser = {}
              postedUser.firstName = user._id;
              postedUser.firstName = user.firstName;
              postedUser.lastName = user.lastName;
              postedUser.profilePic = user.profilePic;
              postedUser.occupation = user.occupation;
              postedUser.dob = user.dob;
              postedUser.gender = user.gender;
              postedUser.school = user.school;
              q.pos = postedUser
              console.log("P", q)
              return postedUser

              })
              let q = {}
              q.propertyInfo = p
              q.userInfo = d
              return q
            }
            else{
              let q = {}
              let d = {}
              q.propertyInfo = p
              q.userInfo = d
              return q
            }
            
       
            
        }))
        // console.log("END", props)
        res.json(props)
    })
    .catch(err => res.status(404).json({ propertiesFound: 'none', error: err }));

};



// @route GET /properties
// @description lists all of the properties in the market
// @access public
exports.property_get_all = (req, res, next) => {
  Property.find()
    .then(proprties => res.json(proprties))
    .catch(err => res.status(404).json({ propertiesFound: 'none' }));

};

// @route GET /properties
// @description lists all of the properties in the market
// @access public
exports.property_favorite = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_KEY);
  console.log("DECODED", decoded)
  console.log("PROPERTY ID", req.body.propertyId)
  console.log("BODY", req.body)

  User.updateOne(
    { _id: decoded.userId },
    [
        {
            $set: {
              favoriteProperties: {
                    $cond: [
                        {
                            $in: [mongoose.Types.ObjectId(req.body.propertyId),"$favoriteProperties"]
                        },
                        {
                            $setDifference: ["$favoriteProperties", [mongoose.Types.ObjectId(req.body.propertyId)]]
                        },
                        {
                            $concatArrays: ["$favoriteProperties",[mongoose.Types.ObjectId(req.body.propertyId)]]
                        }
                    ]
                }
            }
        }
    ]
)
  .then(user => res.json({ msg: 'Updated successfully', favorited: user.favoriteProperties }))
  .catch(err =>
    res.status(400).json({ error: 'Unable to update the Database' })
  );

};


// @route GET /properties
// @description lists all of the properties in the market
// @access public
exports.property_pins = (req, res, next) => {
  console.log("lat", req.query.latitude)
  console.log("long", req.query.longitude)
  console.log("maxdist", req.query.maxDistance)
  // type: req.query.type,
  query = req.query
  
  //AVAILABILITY
  console.log(req.query)
  if(req.query.availableFrom != undefined){
    if(req.query.availableTo != undefined){
      console.log("SETTING AVAILABLE QUERY")
      const to = req.query.availableTo
      const from = req.query.availableFrom
      query.availableFrom ={"$lte": to}
      query.availableTo = {"$gte": from}
    } 
  }
  //AMENITIES
  amens = []
  if(query.Pet_Friendly != undefined){
    amens.push('Pet_Friendly')
    delete query.Pet_Friendly
  }
  if(query.Garages != undefined){
    amens.push('Garages')
    delete query.Garages
  }
  if(query.Swimming_Pool != undefined){
    amens.push('Swimming_Pool')
    delete query.Swimming_Pool
  }
  if(query.Wifi != undefined){
    amens.push('Wifi')
    delete query.Wifi
  }
  if(query.Gym != undefined){
    amens.push('Gym')
    delete query.Gym
  }
  if(query.Washer_Dryer != undefined){
    amens.push('Washer_Dryer')
    delete query.Washer_Dryer
  }
  if(query.Gated_Access != undefined){
    amens.push('Gated_Access')
    delete query.Gated_Access
  }
  if(query.Public_Transportation != undefined){
    amens.push('Public_Transportation')
    delete query.Public_Transportation
  }
  if(query.Heating_Cooling != undefined){
    amens.push('Heating_Cooling')
    delete query.Heating_Cooling
  }
  if(query.Microwave != undefined){
    amens.push('Microwave')
    delete query.Microwave
  }
  if(query.Grill != undefined){
    amens.push('Grill')
    delete query.Grill
  }
  if(query.TV != undefined){
    amens.push('TV')
    delete query.TV
  }
  if(query.Fridge != undefined){
    amens.push('Fridge')
    delete query.Fridge
  }
  if(query.Couch != undefined){
    amens.push('Couch')
    delete query.Couch
  }
  if(query.Oven != undefined){
    amens.push('Oven')
    delete query.Oven
  }
  if(query.Mattress != undefined){
    amens.push('Mattress')
    delete query.Mattress
  }
  if(query.Coffee_Maker != undefined){
    amens.push('Coffee_Maker')
    delete query.Coffee_Maker
  }
  if(query.Toaster != undefined){
    amens.push('Toaster')
    delete query.Toaster
  }
  if(query.Dishes != undefined){
    amens.push('Dishes')
    delete query.Dishes
  }
  if(query.Pots_Pans != undefined){
    amens.push('Pots_Pans')
    delete query.Pots_Pans
  }
  if(query.Utilities_Included != undefined){
    amens.push('Utilities_Included')
    delete query.Utilities_Included
  }
  if(query.Walkin_Closet != undefined){
    amens.push('Walkin_Closet')
    delete query.Walkin_Closet
  }
  if(query.Iron != undefined){
    amens.push('Iron')
    delete query.Iron
  }
  if(query.Freezer != undefined){
    amens.push('Freezer')
    delete query.Freezer
  }
  if(query.Balcony != undefined){
    amens.push('Balcony')
    delete query.Balcony
  }
  if(query.Street_Parking != undefined){
    amens.push('Street_Parking')
    delete query.Street_Parking
  }
  if(query.Pet_FrParking_on_Premesisiendly != undefined){
    amens.push('Parking_on_Premesis')
    delete query.Parking_on_Premesis
  }
  
  if(amens.length != 0){

    query.amenities =  {
      $all: amens
    }
  }





  if (query.priceLow != undefined || query.priceHigh != undefined) {
    price = { $gte: req.query.priceLow, $lte: req.query.priceHigh }
    req.query.price = price
  }
  var coords = [];
  maxDistance = 1600 * 10;
  if (query.maxDistance != undefined) {
    maxDistance = query.maxDistance * 1600;
  }
  if (!(query.latitude == undefined && query.longitude == undefined)) {
    coords[0] = req.query.longitude;
    coords[1] = req.query.latitude;
    console.log(coords)
    query.loc = {
        $near:
        {
          $geometry: {
            type: "Point",
            coordinates: coords
          },
          $maxDistance: maxDistance
        }
  
    }

  }
  delete query.priceHigh
  delete query.priceLow
  delete query.latitude
  delete query.longitude
  delete query.maxDistance

  query.deleted = false
  console.log("PINSQUERY", query)
  Property.find(query, '_id loc price imgList availableFrom availableTo bed bath postedBy title amenities description')
    .then(proprties => res.json(proprties))
    .catch(err => res.status(404).json({ propertiesFound: 'none', error: err }));

};


// @route GET /properties
// @description lists all of the properties in the market
// @access public
exports.property_pins = (req, res, next) => {
  console.log("lat", req.query.latitude)
  console.log("long", req.query.longitude)
  console.log("maxdist", req.query.maxDistance)
  // type: req.query.type,
  query = req.query
  
  //AVAILABILITY
  console.log(req.query)
  if(req.query.availableFrom != undefined){
    if(req.query.availableTo != undefined){
      console.log("SETTING AVAILABLE QUERY")
      const to = req.query.availableTo
      const from = req.query.availableFrom
      query.availableFrom ={"$lte": to}
      query.availableTo = {"$gte": from}
    } 
  }
  //AMENITIES
  amens = []
  if(query.Pet_Friendly != undefined){
    amens.push('Pet_Friendly')
    delete query.Pet_Friendly
  }
  if(query.Garages != undefined){
    amens.push('Garages')
    delete query.Garages
  }
  if(query.Swimming_Pool != undefined){
    amens.push('Swimming_Pool')
    delete query.Swimming_Pool
  }
  if(query.Wifi != undefined){
    amens.push('Wifi')
    delete query.Wifi
  }
  if(query.Gym != undefined){
    amens.push('Gym')
    delete query.Gym
  }
  if(query.Washer_Dryer != undefined){
    amens.push('Washer_Dryer')
    delete query.Washer_Dryer
  }
  if(query.Gated_Access != undefined){
    amens.push('Gated_Access')
    delete query.Gated_Access
  }
  if(query.Public_Transportation != undefined){
    amens.push('Public_Transportation')
    delete query.Public_Transportation
  }
  if(query.Heating_Cooling != undefined){
    amens.push('Heating_Cooling')
    delete query.Heating_Cooling
  }
  if(query.Microwave != undefined){
    amens.push('Microwave')
    delete query.Microwave
  }
  if(query.Grill != undefined){
    amens.push('Grill')
    delete query.Grill
  }
  if(query.TV != undefined){
    amens.push('TV')
    delete query.TV
  }
  if(query.Fridge != undefined){
    amens.push('Fridge')
    delete query.Fridge
  }
  if(query.Couch != undefined){
    amens.push('Couch')
    delete query.Couch
  }
  if(query.Oven != undefined){
    amens.push('Oven')
    delete query.Oven
  }
  if(query.Mattress != undefined){
    amens.push('Mattress')
    delete query.Mattress
  }
  if(query.Coffee_Maker != undefined){
    amens.push('Coffee_Maker')
    delete query.Coffee_Maker
  }
  if(query.Toaster != undefined){
    amens.push('Toaster')
    delete query.Toaster
  }
  if(query.Dishes != undefined){
    amens.push('Dishes')
    delete query.Dishes
  }
  if(query.Pots_Pans != undefined){
    amens.push('Pots_Pans')
    delete query.Pots_Pans
  }
  if(query.Utilities_Included != undefined){
    amens.push('Utilities_Included')
    delete query.Utilities_Included
  }
  if(query.Walkin_Closet != undefined){
    amens.push('Walkin_Closet')
    delete query.Walkin_Closet
  }
  if(query.Iron != undefined){
    amens.push('Iron')
    delete query.Iron
  }
  if(query.Freezer != undefined){
    amens.push('Freezer')
    delete query.Freezer
  }
  if(query.Balcony != undefined){
    amens.push('Balcony')
    delete query.Balcony
  }
  if(query.Street_Parking != undefined){
    amens.push('Street_Parking')
    delete query.Street_Parking
  }
  if(query.Pet_FrParking_on_Premesisiendly != undefined){
    amens.push('Parking_on_Premesis')
    delete query.Parking_on_Premesis
  }
  
  if(amens.length != 0){

    query.amenities =  {
      $all: amens
    }
  }





  if (query.priceLow != undefined || query.priceHigh != undefined) {
    price = { $gte: req.query.priceLow, $lte: req.query.priceHigh }
    req.query.price = price
  }
  var coords = [];
  maxDistance = 1600 * 10;
  if (query.maxDistance != undefined) {
    maxDistance = query.maxDistance * 1600;
  }
  if (!(query.latitude == undefined && query.longitude == undefined)) {
    coords[0] = req.query.longitude;
    coords[1] = req.query.latitude;
    console.log(coords)
    query.loc = {
        $near:
        {
          $geometry: {
            type: "Point",
            coordinates: coords
          },
          $maxDistance: maxDistance
        }
  
    }

  }
  delete query.priceHigh
  delete query.priceLow
  delete query.latitude
  delete query.longitude
  delete query.maxDistance

  query.deleted = false
  console.log("PINSQUERY", query)
  Property.find(query, '_id loc price imgList availableFrom availableTo bed bath postedBy title amenities type description')
    .then(proprties => res.json(proprties))
    .catch(err => res.status(404).json({ propertiesFound: 'none', error: err }));

};





// @route GET /properties/:id
//            /properties/:id/:discover

// @description Get single property by id
// @access Public
exports.increment_view_count = async (req, res, next) => {
  await Property.findById(req.params.id)
    .then(async property => {
        let views = property.numberOfViews + 1
        await Property.findByIdAndUpdate(property._id, {numberOfViews: views})
          .then(property => {
            res.json({status: "Successfully changed"})
            console.log("Successfully changed")
          
          })
          .catch(err =>
            console.log("Error with incrementing view count", err)
          );

        
    })
    .catch(err => res.status(404).json({ propertiesFound: 'No Property found' }));
};

// @route GET /properties/featured
// @description Get the featured properties in a city
// @access Public
exports.featured_property_by_city = (req, res, next) => {
  const city = req.query.city
  ids = []
  console.log(city);
  if (city == "Madison") {
    ids = ["638d0b3e6fe4ffa1c0c864c1", "63e6e7ec0396a666c959aa0c", "638eba368b1c2f61fc237e45", "639164fc0bc347e37789e575", "63a8fa99244bbe86d8c60016"]
  } else if (city == "Chicago") {
    ids = ["639d31c6ef253c676b37eba0", "63b4db696d8a11883e680e81", "639ead066960a3b5f861d7ac", "63a0b19e97c9c8f5bac19bc6", "63ac273d574557e687a1704b"]
  } else if (city == "Austin") {
    ids = ["638aef0385d2e9c86de7e51d", "638b7a09fa4b87de7a9bebee", "638d1f086fe4ffa1c0c865a0", "63995e769c0e1ea5963238f5", "63ff857e51d4a4c49608d11d"]
  } else if (city == "Seattle") {
    ids = ["63f56b6dcb415e3c5f9e36c6", "63f5ae31cb415e3c5f9e3dca"]
  }

  Property.find({_id: {$in: ids}})
    .then(proprties => res.json(proprties))
    .catch(err => res.status(404).json({ featuredProperties: 'none', error: err }));
  
}

// @route GET /properties/:id
// @description Get single property by id
// @access Public
exports.property_get_one = async (req, res, next) => {
  await Property.findById(req.params.id)
    .then(async property => {
      if(property.postedBy == null){
        postedUserInfo = {}
        res.json({ propertyInfo: property, userInfo: postedUserInfo })
      }
      else{
        await User.findById(property.postedBy).then(async user => {
          postedUserInfo = {}
          postedUserInfo.id = user._id
          postedUserInfo.firstName = user.firstName
          postedUserInfo.lastName = user.lastName
          postedUserInfo.profilePic = user.profilePic
          postedUserInfo.occupation = user.occupation;
          postedUserInfo.phoneNumber = user.phoneNumber;
          postedUserInfo.dob = user.dob;
          postedUserInfo.gender = user.gender;
          postedUserInfo.school = user.school;
          postedUserInfo.cribConnectUser = user.cribPremium.paymentDetails.status;
          
          changeNumberOfViews = {}
          console.log(req.body.viewCount)
          if(String(req.body.viewCount) === "true"){
            changeNumberOfViews.numberOfViews = property.numberOfViews + 1;
            console.log("INCREMENT")
          } else{
            changeNumberOfViews.numberOfViews = property.numberOfViews;
            console.log("VIEW COUNT NOT CHANGED")
          }
          await Property.findByIdAndUpdate(property._id, changeNumberOfViews)
          .then(property => {
            console.log("Successfully changed")
          })
          .catch(err =>
            console.log("Error with incrementing view count", err)
          );
          console.log("ChangeNumberOfViews,", changeNumberOfViews)
          res.json({ propertyInfo: property, userInfo: postedUserInfo })
        })
        .catch(err => res.status(404).json({ Error: 'Invalid User in Property soldBy field' }));
      }
    })
    .catch(err => res.status(404).json({ Error: 'No Property found' }));
};

// @route POST /properties
// @description post property
// @access Public
exports.property_create = (req, res, next) => {
 

  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_KEY);
  propImgList = []
  for (let i = 0; i < req.files.length; i++) {
    propImgList[i] = ('https://crib-llc.herokuapp.com/properties/propertyImages/' + req.files[i].filename)
  }
  var coor = []
  coor[0] = req.body.longitude
  coor[1] = req.body.latitude

  let roommatesGender;
  let sharedGender;

  let preferenceGender = "Both"

  if(req.body.roommatesGender == undefined || req.body.roommatesGender == null){
    roommatesGender = "";
  }
  else{
    roommatesGender = req.body.roommatesGender;
  }

  if(req.body.sharedGender == undefined || req.body.sharedGender == null){
    sharedGender = "";
  }
  else{
    sharedGender = req.body.sharedGender;
  }
  if(req.body.preferenceGender != undefined){
    preferenceGender = req.body.preferenceGender
  }

  const property = new Property({
    //_id: new mongoose.Types.ObjectId(),
    title: req.body.title,
    type: req.body.type,
    timePosted: new Date(),
    postedBy: decoded.userId,
    price: req.body.price,
    availableFrom: req.body.availableFrom,
    availableTo: req.body.availableTo,
    imgList: propImgList,
    amenities: req.body.amenities,
    description: req.body.description,
    bed: req.body.bed,
    bath: req.body.bath,
    securityDeposit: req.body.securityDeposit,
    availabilityFlexibility: req.body.availabilityFlexibility,
    roommates: req.body.roommates,
    roommatesGender: roommatesGender,
    shared: req.body.shared,
    sharedGender: sharedGender,
    loc: {
      type: "Point",
      coordinates: coor,
      streetAddr: req.body.streetAddr,
      secondaryTxt: req.body.secondaryTxt,
    },
    deleted: false,
    numberOfViews: 0,
    detailedPreferences:{
      preferenceAgeRange:[18,50],
      preferenceGender: preferenceGender,
      preferencePartialSublease: true,
      preferenceStudent: false
    },
    numberOfRoommates: req.body.numberOfRoommates == undefined ? 0 : req.body.numberOfRoommates,
    rentPaymentTime: req.body.rentPaymentTime == undefined ? "Beginning" : req.body.rentPaymentTime,
    rentPaymentMethod: req.body.rentPaymentMethod == undefined ? "" : req.body.rentPaymentMethod,
    otherRentPaymentMethods: req.body.otherRentPaymentMethods == undefined ? "" : otherRentPaymentMethods,
    privateBathroom: req.body.privateBathroom == undefined ? true : req.body.privateBathroom,
    utilitiesFee: req.body.utilitiesFee == undefined ? 0 : req.body.utilitiesFee,
    wifiFee: req.body.wifiFee == undefined ? 0 : req.body.wifiFee,
    WDLocation: req.body.WDLocation == undefined ? "In-building" : req.body.WDLocation,
    messageToSubtenant: req.body.messageToSubtenant == undefined ? "" : req.body.messageToSubtenant
  });

  console.log("create")
  property
  .save()
  .then(async (property) => {
    console.log(property)

    console.log("DECODEEEEDEE ID ", decoded.userId)
    User.findOneAndUpdate(
      { _id: decoded.userId },
      { $push: { postedProperties: property._id } },

      function (err, model) {
        if (err) {
          //console.log(err);q
          return res.send(err);
        }
      }
    )

    await fetch('https://crib-llc.herokuapp.com/automation/generatesubtenantarrayforuser', {
      method: 'POST',
      headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          propId: property._id
      })
      }).then(async e => {
        res.status(200).json({data:"success"})
      })
      .catch( e => {
      console.log("Error in sending message")
      })
  })
  .catch(err => res.status(400).json({ error: 'Unable to add this property', errRaw: err }));


  // User.findById(decoded.userId).then(async user => {
    // await Subtenant.find({}).then(async subtenants=>{
    //   subtenants.forEach( dude =>{
    //     console.log(dude)
    //     console.log("FROM COND: " + (new Date(String(req.body.availableFrom)))+  "     " + (new Date(String(dude.subleaseStart))),(new Date(req.body.availableFrom) <= new Date(dude.subleaseStart)))
    //     console.log("TO COND: " + String(req.body.availableTo)+ "     " + String(dude.subleaseEnd), (new Date(req.body.availableTo) >= new Date(dude.subleaseEnd)))
    //     console.log("DISTANCE: ", getDistInMiles(coor[1], coor[0], dude.coords[1], dude.coords[0]))
    //     if(new Date(req.body.availableFrom) <= new Date(dude.subleaseStart) && new Date(req.body.availableTo) >= new Date(dude.subleaseEnd)  && getDistInMiles(coor[1], coor[0], dude.coords[1], dude.coords[0]) <= 20){
    //       console.log("Match", dude)
    //       Subtenant.updateOne(
    //         { _id: dude._id },
    //         { $push: { cribConnectSubtenants: _id } }
    //      )
    //     }
    //   })
    // })

    
// });
  
};



function getDistInMiles(lat1, lon1, lat2, lon2) {
  return _getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) * 0.621371;
}

function _getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in kilometers
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in KM
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}




// @route POST /properties
// @description post property with scraped data
// @access Public
exports.property_scraped_images = (req, res, next) => {
//   const token = req.headers.authorization.split(" ")[1];
//   const decoded = jwt.verify(token, process.env.JWT_KEY);
propImgList = []

  if(req.files != undefined){
    console.log(JSON.stringify(req.files))
    for (let i = 0; i < req.files.length; i++) {
      propImgList[i] = ('https://crib-llc.herokuapp.com/properties/propertyImages/' + req.files[i].filename)
    }
  }
    res.json({ msg:  propImgList})
};

// @route POST /properties
// @description post property with scraped data
// @access Public
exports.property_scraped = (req, res, next) => {
  //   const token = req.headers.authorization.split(" ")[1];
  //   const decoded = jwt.verify(token, process.env.JWT_KEY);
      propImgList = [req.body.propImg0, req.body.propImg1, req.body.propImg2, req.body.propImg3]
      var coor = []
      coor[0] = req.body.longitude
      coor[1] = req.body.latitude
      console.log("COORDS: " + coor)
      console.log("BODY: " + JSON.stringify(req.body))
      
    const property = new Property({
      //_id: new mongoose.Types.ObjectId(),
      title: req.body.title,
      type: req.body.type,
      timePosted: req.body.timePosted,
      postedBy: null,
      price: req.body.price,
      availableFrom: req.body.availableFrom,
      availableTo: req.body.availableTo,
      imgList: propImgList,
      amenities: req.body.amenities,
      description: req.body.description,
      bed: req.body.bed,
      bath: req.body.bath,
      securityDeposit: req.body.securityDeposit,
      availabilityFlexibility: req.body.availabilityFlexibility,
      loc: {
        type: "Point",
        coordinates: coor,
        streetAddr: req.body.streetAddr,
        secondaryTxt: req.body.secondaryTxt,
      },
      deleted: false,
      numberOfViews: 0
    });

    console.log("PROPERTY OBJECT")
    console.log(property)
    property
    .save()
    .then(async (property) => {
      res.json({ msg: 'property added successfully' })
    })
    .catch(err => res.status(400).json({ error: 'Unable to add this property', errRaw: err }));
  };

// @route PUT /properties/:id
// @description Update property
// @access Public
exports.property_modify = async(req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_KEY);
  const userId = decoded.userId
    Property.findById(req.params.id)
    .then(async property => {
      if(userId == property.postedBy ){
      Property.findByIdAndUpdate(req.params.id, req.body)
        .then(prop => res.json({ msg: 'Updated successfully' }))
        .catch(err =>
          res.status(400).json({ error: 'Unable to update the Database' })
        );
      }else{
        return res.status(401).json({
          message: 'Auth failed'
        });
      }
    })    
};


// @route PUT /properties/:id
// @description Update property
// @access Public
exports.property_modify_image = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_KEY);
  const userId = decoded.userId
  Property.findById(req.params.id)
  .then(async property => {
    if(userId == property.postedBy ){
  if(req.body.changeIdx == 0){
    Property.findByIdAndUpdate(req.params.id, {"imgList.0" : 'https://crib-llc.herokuapp.com/properties/propertyImages/' + req.file.filename})
      .then(property => res.json({ 
        msg: 'Updated successfully', 
        propertyImage: 'https://crib-llc.herokuapp.com/properties/propertyImages/' + req.file.filename
      }))
      .catch(err =>
        res.status(400).json({ error: err})
      );
  } else if(req.body.changeIdx == 1){
    Property.findByIdAndUpdate(req.params.id, {"imgList.1" : 'https://crib-llc.herokuapp.com/properties/propertyImages/' + req.file.filename})
    .then(property => res.json({ 
      msg: 'Updated successfully', 
      propertyImage: 'https://crib-llc.herokuapp.com/properties/propertyImages/' + req.file.filename
    }))
    .catch(err =>
      res.status(400).json({ error: err})
    );
  } else if(req.body.changeIdx == 2){
    Property.findByIdAndUpdate(req.params.id, {"imgList.2" : 'https://crib-llc.herokuapp.com/properties/propertyImages/' + req.file.filename})
    .then(property => res.json({ 
      msg: 'Updated successfully', 
      propertyImage: 'https://crib-llc.herokuapp.com/properties/propertyImages/' + req.file.filename
    }))
    .catch(err =>
      res.status(400).json({ error: err})
    );
  } else if(req.body.changeIdx == 3){
    Property.findByIdAndUpdate(req.params.id, {"imgList.3" : 'https://crib-llc.herokuapp.com/properties/propertyImages/' + req.file.filename})
    .then(property => res.json({ 
      msg: 'Updated successfully', 
      propertyImage: 'https://crib-llc.herokuapp.com/properties/propertyImages/' + req.file.filename
    }))
    .catch(err =>
      res.status(400).json({ error: err})
    );
  } else if(req.body.changeIdx == 4){
    Property.findByIdAndUpdate(req.params.id, {"imgList.4" : 'https://crib-llc.herokuapp.com/properties/propertyImages/' + req.file.filename})
    .then(property => res.json({ 
      msg: 'Updated successfully', 
      propertyImage: 'https://crib-llc.herokuapp.com/properties/propertyImages/' + req.file.filename
    }))
    .catch(err =>
      res.status(400).json({ error: err})
    );
  }
}else{
  return res.status(401).json({
    message: 'Auth failed'
  });
}
})
};

// @route DELETE /properties/:id
// @description Delete property by id
// @access Public
exports.property_delete = async (req, res, next) => {
  // Property.findByIdAndRemove(req.params.id, query)
  //   .then(property => res.json({ mgs: 'Property deleted successfully' }))
  //   .catch(err => res.status(404).json({ error: 'No such a property' }));
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_KEY);

  await Property.findByIdAndUpdate(req.params.id, {deleted: true})
  .then(async property => {
    await User.updateOne(
      { _id: decoded.userId },
      [
          {
              $set: {
                postedProperties: {
                              $setDifference: ["$postedProperties", [req.params.id]]
                  }
              }
          }
      ]
  )
  

  })
  .catch(err =>
    res.status(400).json({ error: 'Unable to update the Database' })
  );
  return res.json({ msg: 'Updated successfully' })
};

// @route POST /properties/interenal/subleased
// @description Update property
// @access Public
exports.sublease_successful = async(req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_KEY);
  const userId = decoded.userId
  const propId = req.body.propId
  const completed_obj = new Completed(
    { propId: propId,  
      time: Date(),
      userId: userId
    });
  completed_obj
  .save()
  .then(async (property) => {
    res.json({ msg: 'Property was successfully subleased' })
  })
  .catch(err => res.status(400).json({ error: 'Unable to sublease property ', errRaw: err }));
};
// @route POST /properties/internal/subleasedwithcomments
// @description Update property
// @access Public
exports.sublease_successful_withcomments = async (req, res, next) => {
  if(req.body.success == undefined || req.body.comments == undefined || req.body.propId == undefined){
    res.status(404).json({data: "Error"})
  }
  else{
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const userId = decoded.userId
    const propId = req.body.propId
    const completed_obj = new Completed(
      { propId: propId,  
        time: Date(),
        userId: userId,
        success: req.body.success,
        comments: req.body.comments
      });
    completed_obj
    .save()
    .then(async (property) => {
      res.status(200).json({ msg: 'Property was successfully subleased' })
    })
    .catch(err => res.status(400).json({ error: 'Unable to sublease property ', errRaw: err }));
  }
};

// @route POST /properties/interenal/fb
// @description Update property
// @access Public
exports.fb_contacts = async(req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_KEY);
  const userId = decoded.userId
  const propId = req.body.propId
  const fb_contacts = new FBContacts(
    { propId: req.body.propId,  
      time: Date(),
      userId: decoded.userId
    });
    fb_contacts
  .save()
  .then(async (p) => {
    res.json({ msg: 'Contact was successfully recorded' })
  })
  .catch(err => res.status(400).json({ error: 'Unable to record contact', errRaw: err }));
};


//@route: /getAllNewYorkPosting
//@description: Get all New York properties, aggregaete proepties and user data

exports.get_all_ny_properties = (req, res, next) => {

    console.log("lat", req.query.latitude)
    console.log("long", req.query.longitude)
    console.log("maxdist", req.query.maxDistance)
    query = req.query
    
    //AVAILABILITY
    console.log("PROPERTTY QUERY", req.query)
    if(req.query.availableFrom != undefined){
      if(req.query.availableTo != undefined){
        console.log("SETTING AVAILABLE QUERY")
        const to = req.query.availableTo
        const from = req.query.availableFrom
        query.availableFrom ={"$lte": to}
        query.availableTo = {"$gte": from}
      } 
    }
  
  
  
    amens = []
    if(query.Pet_Friendly != undefined){
      amens.push('Pet_Friendly')
      delete query.Pet_Friendly
    }
    if(query.Garages != undefined){
      amens.push('Garages')
      delete query.Garages
    }
    if(query.Swimming_Pool != undefined){
      amens.push('Swimming_Pool')
      delete query.Swimming_Pool
    }
    if(query.Wifi != undefined){
      amens.push('Wifi')
      delete query.Wifi
    }
    if(query.Gym != undefined){
      amens.push('Gym')
      delete query.Gym
    }
    if(query.Washer_Dryer != undefined){
      amens.push('Washer_Dryer')
      delete query.Washer_Dryer
    }
    if(query.Gated_Access != undefined){
      amens.push('Gated_Access')
      delete query.Gated_Access
    }
    if(query.Public_Transportation != undefined){
      amens.push('Public_Transportation')
      delete query.Public_Transportation
    }
    if(query.Heating_Cooling != undefined){
      amens.push('Heating_Cooling')
      delete query.Heating_Cooling
    }
    if(query.Microwave != undefined){
      amens.push('Microwave')
      delete query.Microwave
    }
    if(query.Grill != undefined){
      amens.push('Grill')
      delete query.Grill
    }
    if(query.TV != undefined){
      amens.push('TV')
      delete query.TV
    }
    if(query.Fridge != undefined){
      amens.push('Fridge')
      delete query.Fridge
    }
    if(query.Couch != undefined){
      amens.push('Couch')
      delete query.Couch
    }
    if(query.Oven != undefined){
      amens.push('Oven')
      delete query.Oven
    }
    if(query.Mattress != undefined){
      amens.push('Mattress')
      delete query.Mattress
    }
    if(query.Coffee_Maker != undefined){
      amens.push('Coffee_Maker')
      delete query.Coffee_Maker
    }
    if(query.Toaster != undefined){
      amens.push('Toaster')
      delete query.Toaster
    }
    if(query.Dishes != undefined){
      amens.push('Dishes')
      delete query.Dishes
    }
    if(query.Pots_Pans != undefined){
      amens.push('Pots_Pans')
      delete query.Pots_Pans
    }
    if(query.Utilities_Included != undefined){
      amens.push('Utilities_Included')
      delete query.Utilities_Included
    }
    if(query.Walkin_Closet != undefined){
      amens.push('Walkin_Closet')
      delete query.Walkin_Closet
    }
    if(query.Iron != undefined){
      amens.push('Iron')
      delete query.Iron
    }
    if(query.Freezer != undefined){
      amens.push('Freezer')
      delete query.Freezer
    }
    if(query.Balcony != undefined){
      amens.push('Balcony')
      delete query.Balcony
    }
    if(query.Street_Parking != undefined){
      amens.push('Street_Parking')
      delete query.Street_Parking
    }
    if(query.Pet_FrParking_on_Premesisiendly != undefined){
      amens.push('Parking_on_Premesis')
      delete query.Parking_on_Premesis
    }
    
    if(amens.length != 0){
  
      query.amenities =  {
        $all: amens
      }
    }
  
    if (query.priceLow != undefined || query.priceHigh != undefined) {
      price = { $gte: req.query.priceLow, $lte: req.query.priceHigh }
      req.query.price = price
    }
    var coords = [];
    maxDistance = 1600 * 10;
    if (query.maxDistance != undefined) {
      maxDistance = query.maxDistance * 1600;
    }
    if (!(query.latitude == undefined && query.longitude == undefined)) {
      coords[0] = req.query.longitude;
      coords[1] = req.query.latitude;
      console.log(coords)
      query.loc = {
        $near:
        {
          $geometry: {
            type: "Point",
            coordinates: coords
          },
          $maxDistance: maxDistance
        }
      }
  
    }
    delete query.priceHigh
    delete query.priceLow
    delete query.latitude
    delete query.longitude
    delete query.maxDistance
    query.deleted = false
    console.log("QUERY", JSON.stringify(query))
  
    Property.find(query)
      .then( async properties => {
        console.log(properties)
        let arr = properties
        let i = 0;
        let props = await Promise.all(properties.map(async p => {
              if(p.postedBy != null){
                let d = await User.findById(p.postedBy).then(async user => {
                let q = p
  
                postedUser = {}
                postedUser._id = user._id;
                postedUser.firstName = user.firstName;
                postedUser.lastName = user.lastName;
                postedUser.profilePic = user.profilePic;
                postedUser.occupation = user.occupation;
                postedUser.dob = user.dob;
                postedUser.gender = user.gender;
                postedUser.school = user.school;
                postedUser.phoneNumber = user.phoneNumber;
                postedUser.cribConnectUser = user.cribPremium.paymentDetails.status
                postedUser.email = user.email
                q.pos = postedUser
                console.log("P", q)
                return postedUser
  
                })
                let q = {}
                q.propertyInfo = p
                q.userInfo = d
                return q
              }
              else{
                let q = {}
                let d = {}
                q.propertyInfo = p
                q.userInfo = d
                return q
              }
              
         
              
          }))
          // console.log("END", props)
          res.json(props)
      })
      .catch(err => res.status(404).json({ propertiesFound: 'none', error: err }));
  };


//route GET /getAllNewYorkPostingLimit8
//description Get 8 properties at a time to improve performance


exports.get_all_ny_properties_limit8 = (req, res, next) => {

  console.log("lat", req.query.latitude)
  console.log("long", req.query.longitude)
  console.log("maxdist", req.query.maxDistance)
  query = req.query
  
  //AVAILABILITY
  console.log("PROPERTTY QUERY", req.query)
  if(req.query.availableFrom != undefined){
    if(req.query.availableTo != undefined){
      console.log("SETTING AVAILABLE QUERY")
      const to = req.query.availableTo
      const from = req.query.availableFrom
      query.availableFrom ={"$lte": to}
      query.availableTo = {"$gte": from}
    } 
  }



  amens = []
  if(query.Pet_Friendly != undefined){
    amens.push('Pet_Friendly')
    delete query.Pet_Friendly
  }
  if(query.Garages != undefined){
    amens.push('Garages')
    delete query.Garages
  }
  if(query.Swimming_Pool != undefined){
    amens.push('Swimming_Pool')
    delete query.Swimming_Pool
  }
  if(query.Wifi != undefined){
    amens.push('Wifi')
    delete query.Wifi
  }
  if(query.Gym != undefined){
    amens.push('Gym')
    delete query.Gym
  }
  if(query.Washer_Dryer != undefined){
    amens.push('Washer_Dryer')
    delete query.Washer_Dryer
  }
  if(query.Gated_Access != undefined){
    amens.push('Gated_Access')
    delete query.Gated_Access
  }
  if(query.Public_Transportation != undefined){
    amens.push('Public_Transportation')
    delete query.Public_Transportation
  }
  if(query.Heating_Cooling != undefined){
    amens.push('Heating_Cooling')
    delete query.Heating_Cooling
  }
  if(query.Microwave != undefined){
    amens.push('Microwave')
    delete query.Microwave
  }
  if(query.Grill != undefined){
    amens.push('Grill')
    delete query.Grill
  }
  if(query.TV != undefined){
    amens.push('TV')
    delete query.TV
  }
  if(query.Fridge != undefined){
    amens.push('Fridge')
    delete query.Fridge
  }
  if(query.Couch != undefined){
    amens.push('Couch')
    delete query.Couch
  }
  if(query.Oven != undefined){
    amens.push('Oven')
    delete query.Oven
  }
  if(query.Mattress != undefined){
    amens.push('Mattress')
    delete query.Mattress
  }
  if(query.Coffee_Maker != undefined){
    amens.push('Coffee_Maker')
    delete query.Coffee_Maker
  }
  if(query.Toaster != undefined){
    amens.push('Toaster')
    delete query.Toaster
  }
  if(query.Dishes != undefined){
    amens.push('Dishes')
    delete query.Dishes
  }
  if(query.Pots_Pans != undefined){
    amens.push('Pots_Pans')
    delete query.Pots_Pans
  }
  if(query.Utilities_Included != undefined){
    amens.push('Utilities_Included')
    delete query.Utilities_Included
  }
  if(query.Walkin_Closet != undefined){
    amens.push('Walkin_Closet')
    delete query.Walkin_Closet
  }
  if(query.Iron != undefined){
    amens.push('Iron')
    delete query.Iron
  }
  if(query.Freezer != undefined){
    amens.push('Freezer')
    delete query.Freezer
  }
  if(query.Balcony != undefined){
    amens.push('Balcony')
    delete query.Balcony
  }
  if(query.Street_Parking != undefined){
    amens.push('Street_Parking')
    delete query.Street_Parking
  }
  if(query.Pet_FrParking_on_Premesisiendly != undefined){
    amens.push('Parking_on_Premesis')
    delete query.Parking_on_Premesis
  }
  
  if(amens.length != 0){

    query.amenities =  {
      $all: amens
    }
  }

  if (query.priceLow != undefined || query.priceHigh != undefined) {
    price = { $gte: req.query.priceLow, $lte: req.query.priceHigh }
    req.query.price = price
  }
  var coords = [];
  maxDistance = 1600 * 10;
  if (query.maxDistance != undefined) {
    maxDistance = query.maxDistance * 1600;
  }
  if (!(query.latitude == undefined && query.longitude == undefined)) {
    coords[0] = req.query.longitude;
    coords[1] = req.query.latitude;
    console.log(coords)
    query.loc = {
      $near:
      {
        $geometry: {
          type: "Point",
          coordinates: coords
        },
        $maxDistance: maxDistance
      }
    }

  }
  delete query.priceHigh
  delete query.priceLow
  delete query.latitude
  delete query.longitude
  delete query.maxDistance
  query.deleted = false
  console.log("QUERY", JSON.stringify(query))

  Property.find(query, null, { skip: req.query.page * 8, limit: 8 })
    .then( async properties => {
      console.log(properties)
      let arr = properties
      let i = 0;
      let props = await Promise.all(properties.map(async p => {
            if(p.postedBy != null){
              let d = await User.findById(p.postedBy).then(async user => {
              let q = p

              postedUser = {}
              postedUser._id = user._id;
              postedUser.firstName = user.firstName;
              postedUser.lastName = user.lastName;
              postedUser.profilePic = user.profilePic;
              postedUser.occupation = user.occupation;
              postedUser.dob = user.dob;
              postedUser.gender = user.gender;
              postedUser.school = user.school;
              postedUser.phoneNumber = user.phoneNumber;
              postedUser.cribConnectUser = user.cribPremium.paymentDetails.status
              postedUser.email = user.email
              q.pos = postedUser
              console.log("P", q)
              return postedUser

              })
              let q = {}
              q.propertyInfo = p
              q.userInfo = d
              return q
            }
            else{
              let q = {}
              let d = {}
              q.propertyInfo = p
              q.userInfo = d
              return q
            }
            
       
            
        }))
        // console.log("END", props)
        res.json(props)
    })
    .catch(err => res.status(404).json({ propertiesFound: 'none', error: err }));
};

exports.add_subtenant_request = (req, res, next) => {
  console.log("INside")
  //Check data completeness
  if(req.body.subtenantId == undefined || req.body.requestStart == undefined || req.body.requestEnd == undefined ||
    req.body.requestMessage == undefined || req.body.numOfOccupants == undefined || req.body.propId == undefined){
    res.status(404).json({error: "Incomplete information."})
  }
  else{

    let toAdd = {
      subtenantId: req.body.subtenantId,
      requestStart: req.body.requestStart,
      requestEnd: req.body.requestEnd,
      requestMessage: req.body.requestMessage,
      numOfOccupants: req.body.numOfOccupants,
      createdAt: new Date()
    }
    Property.findOneAndUpdate({"_id" : req.body.propId}, {$push: {"subleaseRequests" : toAdd}})
    .then( r => res.status(200).json({"data":"Subtenant successfully addded"}))
    .catch( e => {
      console.log(e)
      res.status(404).json({"error": e }
      )})
  }
}


//@routes /getRequestsReceived
//@description for tenants to check if they have received any requests

exports.get_subtenant_requests = (req,res,next) => {
  console.log("inside")
  if(req.body.propId == undefined){
    res.status(404).json({error: "Incomplete information."})
  }
  else{
    //Get the list of subleaseRequests
    //add the subtenant info into it too
    Property.find({"_id" : mongoose.Types.ObjectId(req.body.propId)})
    .then( async prop => {   
      let ret = await Promise.all(prop[0].subleaseRequests.map(async subleaseInfo => {
       
        let d = await User.findById(subleaseInfo.subtenantId).then(async sub => {
          return sub
        })
        .catch(e => res.status(400).json({data:e}))
        let q = {}
        q.subleaseInfo = subleaseInfo
        q.subtenantInfo = d
        console.log(q)
        return q      
      }))
      .catch(e => res.status(400).json({data:e}))

        // console.log("END", props)
      res.json(ret)
    })
    .catch(e => res.status(400).json({data:e}))
  }
}