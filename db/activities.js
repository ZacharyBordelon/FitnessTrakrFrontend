const client = require('./client');

// database functions
async function createActivity({ name, description }) {
  // return the new activity
  try {
    const { rows } = await client.query(`

    INSERT INTO activities(name, description)
    VALUES($1, $2)
    ON CONFLICT (name) DO NOTHING
    RETURNING *;
    
    `,[name, description]) 
    return rows[0];
  }
  catch (err){
    throw err;
  }
}

async function getAllActivities() {
  // select and return an array of all activities

  try {
     const {rows} = await client.query(`

     SELECT * FROM activities;

     `); 
     return rows; 

  } catch(err) {
    console.error(err)
  }
}

async function getActivityById(id) {

try {
  const { rows } = await client.query(`
  
    SELECT * FROM activities
    WHERE id = $1;

  `, [id]);
  return rows[0]
} catch(err){
  console.error(err)
}

}

async function getActivityByName(name) {

  try {
    const { rows } = await client.query(`
    
      SELECT * FROM activities
      WHERE name = $1;
  
    `,[name] );
    return rows[0]
  } catch(err){
    console.error(err)
  }

}

async function attachActivitiesToRoutines(routines) {
  // no side effects
  const routinesToReturn = [...routines];
  const binds = routines.map((_, index) => `$${index + 1}`).join(', ');
  const routineIds = routines.map(routine => routine.id);
  if (!routineIds?.length) return [];
  
  // eslint-disable-next-line no-useless-catch
  try {
    // get the activities, JOIN with routine_activities (so we can get a routineId), and only those that have those routine ids on the routine_activities join
    const { rows: activities } = await client.query(`
      SELECT activities.*, routine_activities.duration, routine_activities.count, routine_activities.id AS "routineActivityId", routine_activities."routineId"
      FROM activities 
      JOIN routine_activities ON routine_activities."activityId" = activities.id
      WHERE routine_activities."routineId" IN (${ binds });
    `, routineIds);

    // loop over the routines
    for(const routine of routinesToReturn) {
      // filter the activities to only include those that have this routineId
      const activitiesToAdd = activities.filter(activity => activity.routineId === routine.id);
      // attach the activities to each single routine
      routine.activities = activitiesToAdd;
    }
    return routinesToReturn;
  } catch (error) {
    console.error(error);
  }
}


async function updateActivity({ id, ...fields }) {
  const setString = Object.keys(fields).map(
    (key,index) =>`"${key}"=$${index+1}`
  ).join(', ');
try {
  const { rows } = await client.query(`
  
    UPDATE activities
    SET ${ setString }
    WHERE id=${ id }
    RETURNING *;
  `, Object.values(fields));
  return rows[0];
} catch(err) {
  throw err;
}

}

module.exports = {
  getAllActivities,
  getActivityById,
  getActivityByName,
  attachActivitiesToRoutines,
  createActivity,
  updateActivity,
};
