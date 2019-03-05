// Uses Emscripten stategy for determining environment
const ENVIRONMENT_IS_REACT_NATIVE = typeof navigator === 'object' && navigator.product === 'ReactNative';
const ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
const ENVIRONMENT_IS_WEB = typeof window === 'object';
const ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';

if (ENVIRONMENT_IS_REACT_NATIVE) {
  attach(global);
} else if (ENVIRONMENT_IS_WORKER) {
  attach(self);
} else if (ENVIRONMENT_IS_WEB) {
  attach(window);
} else if (ENVIRONMENT_IS_NODE) {
  attach(global);
} else {
  throw new Error('Unsupported environment for fetch-intercept');
}

function attach(env) {
  // Make sure fetch is avaibale in the given environment
  if (!env.fetch) {
    try {
      require('whatwg-fetch');
    } catch (err) {
      throw Error('No fetch avaibale. Unable to register fetch-intercept');
    }
  }
  env.fetch = (function (fetch) {
    return function (...args) {
      return interceptor(fetch, ...args);
    };
  })(env.fetch);
}

let interceptors = [];

function interceptor(fetch, ...args) {
  const reversedInterceptors = interceptors.reduce((array, interceptor) => [interceptor].concat(array), []);
  let promise = Promise.resolve(args);

  // Register request interceptors
  reversedInterceptors.forEach(({ request, requestError }) => {
    if (request || requestError) {
      promise = promise.then(args => request(...args), requestError);
    }
  });

  // Register fetch call
  promise = promise.then(args => fetch(...args));

  // Register response interceptors
  reversedInterceptors.forEach(({ response, responseError }) => {
    if (response || responseError) {
      promise = promise.then(response, responseError);
    }
  });

  return promise;
}

 function register(interceptor) {
    interceptors.push(interceptor);
    return () => {
      const index = interceptors.indexOf(interceptor);
      if (index >= 0) {
        interceptors.splice(index, 1);
      }
    };
  }
  
function appendAnswer(count, answerType, answer) {
    console.log(answer);
}

register({
    request: function (url, config) {
        // Modify the url or config here
        return [url, config];
    },

    requestError: function (error) {
        // Called when an error occured during another 'request' interceptor call
        return Promise.reject(error);
    },

    response: function (response) {
        if (response.url.match(/https:\/\/www.khanacademy\.org\/api\/internal\/user\/exercises\/.*\/problems/g)) {
			response.json().then(function(data) {  
				/**
				*
				* LOOK
				* HERE
				*
				* :D
				*
				*/
				console.log(data.itemData)
			});
		}
		return response;
    },

    responseError: function (error) {
        // Handle an fetch error
        return Promise.reject(error);
    }
});