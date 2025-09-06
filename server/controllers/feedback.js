import Feedback from '../models/Feedback.js'

export async function saveFeedback(req,res){
  try{
    const data = { ...req.body, user: req.user.id }
    const f = await Feedback.findOneAndUpdate(
      { user:req.user.id, product:req.body.product },
      data,
      { upsert:true, new:true, setDefaultsOnInsert:true }
    )
    res.json(f)
  }catch(e){ res.status(500).json({error:e.message}) }
}

export async function listMyFeedback(req,res){
  try{
    const items = await Feedback.find({ user:req.user.id }).populate('product')
    res.json(items)
  }catch(e){ res.status(500).json({error:e.message}) }
}