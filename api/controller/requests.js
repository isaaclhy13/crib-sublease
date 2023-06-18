const Request = require('../models/request');
const Property = require('../models/property');
const User = require('../models/user');
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const sgMail = require('@sendgrid/mail')

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY)


//************************* REQUESTS CONTROLLER ***************************//
// @route POST /request
// @description creates anew request object
// @access private
exports.requests_create = (req, res, next) => {
    //create a new request object
  const request = new Request({
        tenantId: req.body.tenantId,
        subtenantId: req.body.subtenantId,
        propId: req.body.propId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        numberOfOccupants: req.body.numberOfOccupants,
        about: req.body.about,
        createdAt: new Date(),
        accepted: false,
        timeAccepted: null,
        paid: false,
        tenantSignedContract: false,
        subtenantSignedContract: false
  })
  //save the request object to the database
    request.save()
    .then(r =>  
        {
            //add the request object to the 
            let toAdd = {
                "requestId": r._id,
                "createdAt": new Date()
            }
            User.findOneAndUpdate({"_id": req.body.subtenantId}, {$push: { "requestsSent" : toAdd}})
                .catch(err => res.status(404).json({ error: err }));

            res.status(200).json({data: "Request created", _id: r._id.toString()})
        }    
    
)
    .catch(err => {
        console.log(err)
        res.status(404).json({ error: err })});

};

// @route PUT /request/accepted
// @description updates the requested accepted field to true once the tenant accepts the booking
// @access private
exports.requests_accepted = (req, res, next) => {
  Request.findByIdAndUpdate(req.body.requestId, {accepted: true})
    .then(r => {
        res.status(200).json({data: "Request marked as accepted", _id: r._id.toString()})
    })
    .catch(err => res.status(404).json({ error: err }));

};

// @route delete /request/:id
// @description Delete request - used when tenant declines the request for booking
// @access private
exports.request_delete = (req, res, next) => {
  Request.findOneAndDelete({"_id" : mongoose.Types.ObjectId(req.params.id)})
    .then(r => {
         User.updateMany({}, { $pull: {requestsSent:{requestId: r._id}}})
        .then(users => {
            console.log("Removed")
        })
        res.status(200).json({data: "Request deleted", _id: r._id.toString()})
    })
    .catch(err => res.status(404).json({ error: err }));
};



// @route PUT /request/addEnvelope
// @description PUT This is called from AWS Lambda function after contract gets generated -> takes in request_id and envelope_id in body
// @access private
exports.add_envelope = (req, res, next) => {
  Request.findOneAndUpdate({_id: req.body.requestId}, {envelopeId: req.body.envelopeId})
    .then(r => {
        res.status(200).json({data: "Request updated"})
    })
    .catch(err => res.status(404).json({ error: err }));
};


// @route get /request/myrequests
// @description Gets all of the user's requests
// @access private
exports.request_retrievemyrequests = (req, res, next) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const userId = decoded.userId
        // Request.find({subtenantId: userId}). then(data => {
        //     var propids = data.map(function(x) { return x.propId } );
        //     console.log(propids)
        //     Property.find({
        //         '_id': { $in: propids}
        //     })
        //     .then(r => {
                
        //         res.status(200).json(r)
        //     })
        //     .catch( err => res.status(400).json({data: err}))
        // })
        // .catch( err => res.status(400).json({data: err}))
        Request.aggregate(
            [
            {
                '$lookup': {
                'from': 'users', 
                'localField': 'tenantId', 
                'foreignField': '_id', 
                'as': 'tenantInfo'
                }
            }, 
            {
                '$lookup': {
                'from': 'propertytests', 
                'localField': 'propId', 
                'foreignField': '_id', 
                'as': 'propInfo'
                }
            },
            {
                '$match': {
                'subtenantId': mongoose.Types.ObjectId(userId)
                }
            }
        ])
        .then( data => res.status(200).json(data))
        .catch( e => res.status(400).json)
};

// @route get /request/myreceivedrequests
// @description Gets all of the user's received requests for the property they posted
// @access private
exports.request_retrievemyreceivedrequests = (req, res, next) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const userId = decoded.userId
        Request.aggregate(
        [
            {
                '$lookup': {
                    'from': 'users', 
                    'localField': 'subtenantId', 
                    'foreignField': '_id', 
                    'as': 'subtenantInfo'
                }
            }, {
                '$lookup': {
                    'from': 'propertytests', 
                    'localField': 'propId', 
                    'foreignField': '_id', 
                    'as': 'propInfo'
                }
            }, {
                '$match': {
                    'tenantId': mongoose.Types.ObjectId(userId)
                }
            }
        ])
            .then(r => {
                
                res.status(200).json(r)
            })
            .catch( err => res.status(400).json({data: err}))
}
// @route POST /request/requestesignature
// @description Called when tenant accepts booking - sends contract to both parties
// @access private
exports.request_esignature = (req, res, next) => {
    console.log("BODYYY", req.body)
      Request.findByIdAndUpdate(req.body.request_id, {accepted: true, timeAccepted: new Date()})
    .then(r => {

    fetch('https://0ksxv2pwd7.execute-api.us-east-2.amazonaws.com/Prod', {
        method: 'POST',
        headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        "subleasor_name": req.body.subleasor_name,
        "subtenant_name": req.body.subtenant_name,
        "subleasor_email": req.body.subleasor_email,
        "subtenant_email": req.body.subtenant_email,
        "property_address": req.body.property_address,
        "sublease_start_date": req.body.sublease_start_date,
        "sublease_end_date": req.body.sublease_end_date,
        "rent": req.body.rent,
        "security_deposit": req.body.security_deposit,
        "request_id": req.body.request_id,
        "fee_percentage": "5",
    })
    }).then(async e => {
        res.status(200).json({data: "Request marked as accepted and contracts sent"})
    })
    .catch( e => {
    console.log("Error in sending contract", e)
    })
        })    .catch( e => {
    console.log("Error in marking request as accepted", e)
    })
};

// @route GET /request/contract/signedStatus
// @description Called when tenant accepts booking - sends contract to both parties
// @access private
const DOCUSIGN_ACCESS_TOKEN="eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQoAAAABAAUABwAAi_QOJ3DbSAgAAMsXHWpw20gCAE7zpH6mUhpAlmjmH_Zyx-MVAAEAAAAYAAEAAAAFAAAADQAkAAAAYzhmOWZiNDMtYTZlMi00NjEzLThlM2ItNjQyYjMxNzk1ZjliIgAkAAAAYzhmOWZiNDMtYTZlMi00NjEzLThlM2ItNjQyYjMxNzk1ZjliMACAd8nUDm3bSDcAPcuq3dd7SUuSy9LlC6ZCrQ.xxDdaxXIbhDJW6eyLMGk1KTq9sQJWFo6LNB_-kVKm5q4t1yfNFDyhCRlrjPlLBkQCNlKhae1-HsbHKonLX5EcO4eSx-bBwkWiFCR4BeDD-qrOLXfoGwHlhAYjv5lBgGQKfIQucPE1VlZ_2mQZH4CVtyRKJrhJl8rCSTjuWCsrTm_ZFQ0vyyeIiUeGY-nh4uq92hi7rz2doIbx5JX5UTTE_8o4pou2NToRRKXT5YvjHTv7wXMg4uoTmlkiX5tLLIdRFeyG4X1XvNuWLk897iUF4FN14Ahp1oMs9BtPE3GHzSi8S49HqDpqjRn8_uUwGb4_zjBrHs3eHINAEf--WGYeQ"
const DOCUSIGN_ACCOUNT_ID="1b01896b-b609-4d8c-8d10-1900339b57f6"
exports.signed_status = (req, res, next) => {
    console.log("bruh")
    fetch('https://demo.docusign.net/restapi/v2.1/accounts/'+DOCUSIGN_ACCOUNT_ID+'/envelopes/'+req.params.envelope_id+'/recipients', {
        method: 'GET',
        headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+DOCUSIGN_ACCESS_TOKEN
    }
    }).then(res => res.json()).then(async e => {
        res.status(200).json(
            {
            recipient1: 
                {
                    name: e.signers[0].name,
                    email:e.signers[0].email,
                    status:e.signers[0].status
                },
            recipient2: 
                {
                    name: e.signers[1].name,
                    email:e.signers[1].email,
                    status:e.signers[1].status
                }
            })
    })
    .catch( e => {
    console.log("Error in sending contract", e)
    })
};


//route POST /requests/sendEmailSubtenantRequested
//description use email to send notificaiton 
exports.send_email_subtenant_requested = (req,res,next) => {
    if(req.body.tenantName == undefined || req.body.subtenantName == undefined || req.body.startDate == undefined || req.body.endDate == undefined || 
    req.body.numberOfOccupants == undefined || req.body.bio == undefined || req.body.tenantEmail == undefined ){
        res.status(404).json({data:"Incomplete information."})
    }
    console.log("testing")
    const msg = {
    to: `${req.body.tenantEmail}`, // Change to your recipient
    from: 'cribappllc@gmail.com', // Change to your verified sender
    subject: `${req.body.subtenantName} is interested in your sublease`,
    text: 'and easy to do anywhere, even with Node.js',
    html: `<p>Hey ${req.body.tenantName},</p>
    <p>Thank you for posting on Crib!</p>
    <p>${req.body.subtenantName} just requested to book your sublease, following are the request details:</p> 
    <p>Start date: <strong>${new Date(req.body.startDate).toLocaleDateString().split(",")[0]}</strong></p>
    <p>End date: <strong>${new Date(req.body.endDate).toLocaleDateString().split(",")[0]}<</strong></p> 
    <p>The number of occupants is <strong>${req.body.numberOfOccupants}</strong></p>
    <p>${req.body.bio}</p>
    <strong>To view request, visit www.crib-app.com.</strong>
    <p><strong>Got a question?</strong> Contact us at (608)-515-8038.
    <br/>
    <p>Best,<br/>The Crib team</p>

    `

    }
    sgMail
    .send(msg)
    .then((r) => {
        console.log('Email sent')
        res.status(200).json({data:'email sent'})
    })
    .catch((error) => {
        console.error(error)
    })
}

//route POST /requests/sendEmailTenantAccepted
//description use email to send notificaiton 
exports.send_email_tenant_accepted = (req,res,next) => {
    if(req.body.tenantName == undefined || req.body.subtenantName == undefined || req.body.startDate == undefined || req.body.endDate == undefined || 
    req.body.subtenantEmail == undefined ){
        res.status(404).json({data:"Incomplete information."})
    }
    console.log("testing")
    const msg = {
    to: `${req.body.subtenantEmail}`, // Change to your recipient
    from: 'cribappllc@gmail.com', // Change to your verified sender
    subject: `${req.body.tenantName} accepted your sublease request`,
    text: 'and easy to do anywhere, even with Node.js',
    html: `<p>Hey ${req.body.subtenantName},</p>
    <p>${req.body.tenantName} just accepted your sublease request and have signed the sublease contract. Please preview your sublease contract and pay the required fees and security deposit under "My requests" on www.crib-app.com.</p> 
    <p>Once the contract is signed and payments are completed, you will be given tenant's contact information to discuss move-in procedure and rental payments. We look forward to finding you your next Crib!</p>
    <p><strong>Got a question?</strong> Contact us at (608)-515-8038.
    <br/>
    <p>Best,<br/>The Crib team</p>
    `}
    sgMail
    .send(msg)
    .then((r) => {
        console.log('Email sent')
        res.status(200).json({data:'email sent'})
    })
    .catch((error) => {
        console.error(error)
    })
}

//route POST /requests/sendEmailSubenantAccepted
//description use email to send notificaiton 
exports.send_email_subtenant_accepted = (req,res,next) => {
    if(req.body.tenantName == undefined || req.body.subtenantName == undefined || req.body.startDate == undefined || req.body.endDate == undefined || 
    req.body.subtenantEmail == undefined || req.body.subtenantPhoneNumber == undefined || req.body.subtenantEmail == undefined || req.body.subtenantCountryCode == undefined) {
        res.status(404).json({data:"Incomplete information."})
    }
    console.log("testing")
    const msg = {
    to: `${req.body.tenantEmail}`, // Change to your recipient
    from: 'cribappllc@gmail.com', // Change to your verified sender
    subject: `${req.body.subtenantName} signed the sublease contract`,
    text: 'and easy to do anywhere, even with Node.js',
    html: `<p>Hey ${req.body.tenantName},</p>
    <p>${req.body.subtenantName} just signed the sublease contract and paid security deposit. ${req.body.subtenantName}'s phone number and email are +${req.body.subtenantCountryCode}${req.body.subtenantPhoneNumber} and ${req.body.subtenantEmail}. Please tell ${req.body.subtenantName} more about the move-in procedure and how rent would be paid over the sublease period.</p> 
    <p>Security deposit will be transferred to you once both parties confirmed a successful move-in on the sublease start date.</p>
    <p><strong>Got a question?</strong> Contact us at (608)-515-8038.
    <br/>
    <p>Best,<br/>The Crib team</p>
    `}
    sgMail
    .send(msg)
    .then((r) => {
        console.log('Email sent')
        res.status(200).json({data:'email sent'})
    })
    .catch((error) => {
        console.error(error)
    })
}


// @route POST /request/docusign_webhook
// @description Called when tenant accepts booking - sends contract to both parties
// @access public

exports.docusign_webhook = (req, res, next) => {
    Request.findOne({envelopeId: req.body.envelopeId}).then(r=>{
        if(r.tenantSignedContract == false){
            //Mark tenant as signed contract
            Request.findOneAndUpdate({envelopeId: req.body.envelopeId}, {tenantSignedContract:true}).then(re=>{
                    //For payment generation endoint, we need two things: propId and requestId
                    User.findOne({_id: re.tenantId}).then(result =>{
                        console.log({
                            "propId": result.postedProperties[0],
                            "requestId": re._id,
                            "userId": re.subtenantId
                        })
                        fetch('https://crib-llc.herokuapp.com/payments/generate', {
                            method: 'POST',
                            headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            "propId": result.postedProperties[0],
                            "requestId": re._id,
                            "userId": re.subtenantId,
                            "startDate": re.startDate,
                            "endDate": re.endDate

                        }
                        )
                        }).then(async e => e.json()).then(result=>{
                                                        console.log("result: ", result)
                            res.status(200).json({data:'Recipient Signing Status Updated and payment linked to request'})
                        })
                    })
            })


        } else{
            //Mark subtenant as signed contract
            Request.findOneAndUpdate({envelopeId: req.body.envelopeId}, {subtenantSignedContract:true}).then(re=>{
                    res.status(200).json({data:'Recipient Signing Status Updated'})
            })
        }

    }).catch((error) => {
        console.error(error)
    })
}


// @route POST /request/payment_link/:id
// @description gets the payment link attatched to this request
// @access public

exports.get_payment_link = (req, res, next) => {
    Request.findOne({_id:req.params.id}).then(r=>{
        Payment.findOne({_id:r.paymentId}).then(result=>{
            res.status(200).json({link:result.paymentLink.url})
        })
    })
}

// @route GET /requests/getOne/:id
// @description gets the payment link attatched to this request
// @access public
exports.get_one_request = (req, res, next) => {
    console.log(req.params)
    // Request.findOne({_id: mongoose.Types.ObjectId(req.params.id)})
    // .then(r=>{
    //     res.status(200).json(r)
    // })
    // .catch( e => res.status(404).json({data:'error'}))

    Request.aggregate(
        [
        {
            '$lookup': {
            'from': 'users', 
            'localField': 'tenantId', 
            'foreignField': '_id', 
            'as': 'tenantInfo'
            }
        }, 
        {
            '$lookup': {
            'from': 'propertytests', 
            'localField': 'propId', 
            'foreignField': '_id', 
            'as': 'propInfo'
            }
        },
        {
            '$lookup': {
            'from': 'users', 
            'localField': 'subtenantId', 
            'foreignField': '_id', 
            'as': 'subtenantInfo'
            }
        },
        {
            '$match': {
            '_id': mongoose.Types.ObjectId(req.params.id)
            }
        }
    ])
    .then( data => res.status(200).json(data))
    .catch( e => res.status(400).json)
}

// @route POST /request/payment_amount/:id
 // @description gets the payment link attatched to this request
 // @access public

 exports.get_payment_amount = (req, res, next) => {
    Request.findOne({_id:req.params.id}).then(r=>{
        Payment.findOne({_id:r.paymentId}).then(result=>{
            res.status(200).json({amount:result.amount})
        })
    })
}