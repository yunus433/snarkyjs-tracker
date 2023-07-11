const TYPE_VALUES = ['query_repo', 'check_repo'];

module.exports = (data, callback) => {
  // query_repo
  /*
    {
      min_time, // isNaN(new Date(min_time))
      max_time, (min_time + 5 dk)
    },
    callback(err, {
      success: bool,
      data: [
        {
          git_id: repo_id,
          title: title,
          dev_id: dev_id
        }
      ]
    })
  */
 // check_repo
  /*
    {
      git_id: repo_id,
    },
    callback(err, {
      success: is_snarkyjs ?,
      data: null | [
        {
          git_id: repo_id,
          title: title,
          dev_id: dev_id
        }
      ]
    })
  */
}