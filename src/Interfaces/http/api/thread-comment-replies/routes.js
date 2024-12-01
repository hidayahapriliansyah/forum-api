const routes = (handler) => ([
  {
    method: 'POST',
    path: '/threads/{threadId}/comments/{commentId}/replies',
    handler: handler.postThreadCommentReplyHandler,
    options: {
      auth: 'forumapi_jwt',
    },
  },
  // {
  //   method: 'DELETE',
  //   path: '/threads/{threadId}/comments/{commentId}/replies',
  //   // handler: handler.postUserHandler,
  //   handler: () => {},
  // },
]);

module.exports = routes;
