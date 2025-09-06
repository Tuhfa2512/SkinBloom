import Log from '../models/Log.js'

export async function myTimeline(req,res){
  try{
    const logs = await Log.find({ user:req.user.id }).sort({ date:1 })
    // Simple progress metric: inverse of acne+redness+dryness
    const timeline = logs.map(l => ({
      date: l.date,
      score: 30 - ((l.skinCondition?.acne||0)+(l.skinCondition?.redness||0)+(l.skinCondition?.dryness||0))
    }))
    res.json({ timeline, logs })
  }catch(e){ res.status(500).json({error:e.message}) }
}