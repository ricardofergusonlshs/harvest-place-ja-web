/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/auth/page",{

/***/ "(app-pages-browser)/./src/app/auth/auth-client.tsx":
/*!**************************************!*\
  !*** ./src/app/auth/auth-client.tsx ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



;
    // Wrapped in an IIFE to avoid polluting the global scope
    ;
    (function () {
        var _a, _b;
        // Legacy CSS implementations will `eval` browser code in a Node.js context
        // to extract CSS. For backwards compatibility, we need to check we're in a
        // browser context before continuing.
        if (typeof self !== 'undefined' &&
            // No-JS mode does not inject these helpers:
            '$RefreshHelpers$' in self) {
            // @ts-ignore __webpack_module__ is global
            var currentExports = module.exports;
            // @ts-ignore __webpack_module__ is global
            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;
            // This cannot happen in MainTemplate because the exports mismatch between
            // templating and execution.
            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);
            // A module can be accepted automatically based on its exports, e.g. when
            // it is a Refresh Boundary.
            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {
                // Save the previous exports signature on update so we can compare the boundary
                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)
                module.hot.dispose(function (data) {
                    data.prevSignature =
                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);
                });
                // Unconditionally accept an update to this module, we'll check if it's
                // still a Refresh Boundary later.
                // @ts-ignore importMeta is replaced in the loader
                module.hot.accept();
                // This field is set when the previous version of this module was a
                // Refresh Boundary, letting us know we need to check for invalidation or
                // enqueue an update.
                if (prevSignature !== null) {
                    // A boundary can become ineligible if its exports are incompatible
                    // with the previous exports.
                    //
                    // For example, if you add/remove/change exports, we'll want to
                    // re-execute the importing modules, and force those components to
                    // re-render. Similarly, if you convert a class component to a
                    // function, we want to invalidate the boundary.
                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {
                        module.hot.invalidate();
                    }
                    else {
                        self.$RefreshHelpers$.scheduleUpdate();
                    }
                }
            }
            else {
                // Since we just executed the code for the module, it's possible that the
                // new exports made it ineligible for being a boundary.
                // We only care about the case when we were _previously_ a boundary,
                // because we already accepted this update (accidental side effect).
                var isNoLongerABoundary = prevSignature !== null;
                if (isNoLongerABoundary) {
                    module.hot.invalidate();
                }
            }
        }
    })();


/***/ }),

/***/ "(app-pages-browser)/./src/app/auth/page.tsx":
/*!*******************************!*\
  !*** ./src/app/auth/page.tsx ***!
  \*******************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ AuthPage),\n/* harmony export */   dynamic: () => (/* binding */ dynamic)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _auth_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./auth-client */ \"(app-pages-browser)/./src/app/auth/auth-client.tsx\");\n/* harmony import */ var _auth_client__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_auth_client__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\nconst dynamic = 'force-dynamic';\nfunction AuthPageFallback() {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"main\", {\n        className: \"mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-16\",\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"section\", {\n            className: \"w-full rounded-[2rem] border border-farm-border bg-white p-8 text-center shadow-sm\",\n            children: [\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"mx-auto h-12 w-12 animate-spin rounded-full border-4 border-farm-border border-t-farm-primary\"\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\home\\\\OneDrive - MOE-CI\\\\Desktop\\\\HPJ\\\\harvest-place-ja-web\\\\harvest-place-ja-web\\\\src\\\\app\\\\auth\\\\page.tsx\",\n                    lineNumber: 10,\n                    columnNumber: 9\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h1\", {\n                    className: \"mt-6 text-2xl font-black text-farm-primaryDark\",\n                    children: \"Loading sign in\"\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\home\\\\OneDrive - MOE-CI\\\\Desktop\\\\HPJ\\\\harvest-place-ja-web\\\\harvest-place-ja-web\\\\src\\\\app\\\\auth\\\\page.tsx\",\n                    lineNumber: 12,\n                    columnNumber: 9\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                    className: \"mt-3 text-sm leading-6 text-farm-muted\",\n                    children: \"Preparing your secure sign-in page.\"\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\home\\\\OneDrive - MOE-CI\\\\Desktop\\\\HPJ\\\\harvest-place-ja-web\\\\harvest-place-ja-web\\\\src\\\\app\\\\auth\\\\page.tsx\",\n                    lineNumber: 16,\n                    columnNumber: 9\n                }, this)\n            ]\n        }, void 0, true, {\n            fileName: \"C:\\\\Users\\\\home\\\\OneDrive - MOE-CI\\\\Desktop\\\\HPJ\\\\harvest-place-ja-web\\\\harvest-place-ja-web\\\\src\\\\app\\\\auth\\\\page.tsx\",\n            lineNumber: 9,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\home\\\\OneDrive - MOE-CI\\\\Desktop\\\\HPJ\\\\harvest-place-ja-web\\\\harvest-place-ja-web\\\\src\\\\app\\\\auth\\\\page.tsx\",\n        lineNumber: 8,\n        columnNumber: 5\n    }, this);\n}\n_c = AuthPageFallback;\nfunction AuthPage() {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react__WEBPACK_IMPORTED_MODULE_1__.Suspense, {\n        fallback: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(AuthPageFallback, {}, void 0, false, {\n            fileName: \"C:\\\\Users\\\\home\\\\OneDrive - MOE-CI\\\\Desktop\\\\HPJ\\\\harvest-place-ja-web\\\\harvest-place-ja-web\\\\src\\\\app\\\\auth\\\\page.tsx\",\n            lineNumber: 26,\n            columnNumber: 25\n        }, this),\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_auth_client__WEBPACK_IMPORTED_MODULE_2__.AuthClient, {}, void 0, false, {\n            fileName: \"C:\\\\Users\\\\home\\\\OneDrive - MOE-CI\\\\Desktop\\\\HPJ\\\\harvest-place-ja-web\\\\harvest-place-ja-web\\\\src\\\\app\\\\auth\\\\page.tsx\",\n            lineNumber: 27,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\home\\\\OneDrive - MOE-CI\\\\Desktop\\\\HPJ\\\\harvest-place-ja-web\\\\harvest-place-ja-web\\\\src\\\\app\\\\auth\\\\page.tsx\",\n        lineNumber: 26,\n        columnNumber: 5\n    }, this);\n}\n_c1 = AuthPage;\nvar _c, _c1;\n$RefreshReg$(_c, \"AuthPageFallback\");\n$RefreshReg$(_c1, \"AuthPage\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL3NyYy9hcHAvYXV0aC9wYWdlLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFpQztBQUNVO0FBRXBDLE1BQU1FLFVBQVUsZ0JBQWdCO0FBRXZDLFNBQVNDO0lBQ1AscUJBQ0UsOERBQUNDO1FBQUtDLFdBQVU7a0JBQ2QsNEVBQUNDO1lBQVFELFdBQVU7OzhCQUNqQiw4REFBQ0U7b0JBQUlGLFdBQVU7Ozs7Ozs4QkFFZiw4REFBQ0c7b0JBQUdILFdBQVU7OEJBQWlEOzs7Ozs7OEJBSS9ELDhEQUFDSTtvQkFBRUosV0FBVTs4QkFBeUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBTTlEO0tBaEJTRjtBQWtCTSxTQUFTTztJQUN0QixxQkFDRSw4REFBQ1YsMkNBQVFBO1FBQUNXLHdCQUFVLDhEQUFDUjs7Ozs7a0JBQ25CLDRFQUFDRixvREFBVUE7Ozs7Ozs7Ozs7QUFHakI7TUFOd0JTIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXGhvbWVcXE9uZURyaXZlIC0gTU9FLUNJXFxEZXNrdG9wXFxIUEpcXGhhcnZlc3QtcGxhY2UtamEtd2ViXFxoYXJ2ZXN0LXBsYWNlLWphLXdlYlxcc3JjXFxhcHBcXGF1dGhcXHBhZ2UudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN1c3BlbnNlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQXV0aENsaWVudCB9IGZyb20gJy4vYXV0aC1jbGllbnQnO1xuXG5leHBvcnQgY29uc3QgZHluYW1pYyA9ICdmb3JjZS1keW5hbWljJztcblxuZnVuY3Rpb24gQXV0aFBhZ2VGYWxsYmFjaygpIHtcbiAgcmV0dXJuIChcbiAgICA8bWFpbiBjbGFzc05hbWU9XCJteC1hdXRvIGZsZXggbWluLWgtWzcwdmhdIG1heC13LXhsIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBweC00IHB5LTE2XCI+XG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJ3LWZ1bGwgcm91bmRlZC1bMnJlbV0gYm9yZGVyIGJvcmRlci1mYXJtLWJvcmRlciBiZy13aGl0ZSBwLTggdGV4dC1jZW50ZXIgc2hhZG93LXNtXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXgtYXV0byBoLTEyIHctMTIgYW5pbWF0ZS1zcGluIHJvdW5kZWQtZnVsbCBib3JkZXItNCBib3JkZXItZmFybS1ib3JkZXIgYm9yZGVyLXQtZmFybS1wcmltYXJ5XCIgLz5cblxuICAgICAgICA8aDEgY2xhc3NOYW1lPVwibXQtNiB0ZXh0LTJ4bCBmb250LWJsYWNrIHRleHQtZmFybS1wcmltYXJ5RGFya1wiPlxuICAgICAgICAgIExvYWRpbmcgc2lnbiBpblxuICAgICAgICA8L2gxPlxuXG4gICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTMgdGV4dC1zbSBsZWFkaW5nLTYgdGV4dC1mYXJtLW11dGVkXCI+XG4gICAgICAgICAgUHJlcGFyaW5nIHlvdXIgc2VjdXJlIHNpZ24taW4gcGFnZS5cbiAgICAgICAgPC9wPlxuICAgICAgPC9zZWN0aW9uPlxuICAgIDwvbWFpbj5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQXV0aFBhZ2UoKSB7XG4gIHJldHVybiAoXG4gICAgPFN1c3BlbnNlIGZhbGxiYWNrPXs8QXV0aFBhZ2VGYWxsYmFjayAvPn0+XG4gICAgICA8QXV0aENsaWVudCAvPlxuICAgIDwvU3VzcGVuc2U+XG4gICk7XG59Il0sIm5hbWVzIjpbIlN1c3BlbnNlIiwiQXV0aENsaWVudCIsImR5bmFtaWMiLCJBdXRoUGFnZUZhbGxiYWNrIiwibWFpbiIsImNsYXNzTmFtZSIsInNlY3Rpb24iLCJkaXYiLCJoMSIsInAiLCJBdXRoUGFnZSIsImZhbGxiYWNrIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/app/auth/page.tsx\n"));

/***/ })

});