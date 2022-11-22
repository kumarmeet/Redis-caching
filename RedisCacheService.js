const redis = require("redis");
const database = require("../services/databaseServices");

let redisClient;

(async () => {
  redisClient = redis.createClient();
  redisClient.on("error", (error) => console.error(`Error : ${error}`));
  await redisClient.connect();
})();

//if using class model then pass only table name and if using mysql npm package then pass sql query
const redisCache = async (
  res,
  action,
  { key, time, data, route, tableName = false, sqlQuery = false }
) => {
  let cacheResults = await redisClient.get(key);

  if (cacheResults) {
    data = JSON.parse(cacheResults);

    console.log("Data coming from redis cache");

    return res.render(route, {
      action: action,
      pageName: key,
      listData: data || [],
    });
  } else {
    if (typeof data === "object" && sqlQuery.length > 0) {
      data = await database.getMultipleRowsQuery(sqlQuery);
    } else if (typeof data === "function" && tableName.length > 0) {
      //when using class based model fetchAll() is using in database custom models
      data = await data.fetchAll(tableName);
    }

    console.log("Data coming from DB");

    await redisClient.setEx(key, time, JSON.stringify(data), {
      EX: 180,
      NX: true,
    });

    res.render(route, {
      action: action,
      pageName: key,
      listData: data || [],
    });
  }
};

module.exports = {
  redisClient,
  redisCache,
};
