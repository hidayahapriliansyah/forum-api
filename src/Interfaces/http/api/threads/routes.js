const { options } = require('@hapi/hapi/lib/cors');

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
  {
    method: 'POST',
    path: '/threads/{threadId}/comments/{commentId}/replies',
    // handler: handler.postUserHandler,
    handler: () => {},
  },
  {
    method: 'DELETE',
    path: '/threads/{threadId}/comments/{commentId}/replies',
    // handler: handler.postUserHandler,
    handler: () => {},
  },
]);

module.exports = routes;
