const routes = (handler) => ([
  {
    method: 'POST',
    path: '/threads',
    // handler: handler.postUserHandler,
    handler: handler.postThreadHandler,
    options: {
      auth: 'forumapi_jwt',
    },
  },
  {
    method: 'GET',
    path: '/threads/{threadId}',
    // handler: handler.postUserHandler,
    handler: handler.getThreadByIdHandler,
  },
]);

module.exports = routes;
