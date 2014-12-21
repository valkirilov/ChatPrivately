'use strict';

angular.module('myApp.directives.logo', [])
.directive('logoDirective', function () {
    return {
        restrict: 'E',
        templateUrl: 'components/directives/logo-directive.html',
        controller: function($scope) {

          var addAnimateCssClass = function(selector, className) {
            var element = angular.element(selector);

            element.addClass(className).addClass('animated');
            element.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
              element.removeClass(className).removeClass('animated');
            });
          };

          $scope.logo = function() {
    
          var logoSelector = '.logo';
          var logo = angular.element('.logo');

          logo.addClass('start');

          var step1_zoomIn = function(callback, timeout) {
            addAnimateCssClass(logoSelector, 'bounceInDown');
            setTimeout(function() {
              callback(step3_rotateIt, 300);
            }, timeout);
          };
          var step2_roundIt = function(callback, timeout) {
            logo.addClass('rounded');
            setTimeout(function() {
              callback(step3_rotateIt, 300);
            }, timeout);
          };
          var step3_rotateIt = function(callback, timeout) {
            logo.addClass('rotate');
            setTimeout(function() {
              callback(step4_borderIt, 300);
            }, timeout);
          };
          var step4_borderIt = function(callback, timeout) {
            logo.addClass('border');
            setTimeout(function() {
              callback(step5_rubberIt, 300);
            }, timeout);
          };
          var step5_rubberIt = function(callback, timeout) {
            addAnimateCssClass(logoSelector, 'pulse');
            setTimeout(function() {
              callback(step6_textifyIt, 10);
            }, timeout);
          };
          var step6_textifyIt = function(callback, timeout) {
            logo.addClass('textify');
            setTimeout(function() {
              callback(step7_dot1It, 50);
            }, timeout);
          };
          var step7_dot1It = function(callback, timeout) {
            logo.find('span.dot1').addClass('dot-show');
            addAnimateCssClass(logoSelector+' .inner p span.dot1', 'bounceIn');
            setTimeout(function() {
              callback(step8_dot2It, 50);
            }, timeout);
          };
          var step8_dot2It = function(callback, timeout) {
            logo.find('span.dot2').addClass('dot-show');
            addAnimateCssClass(logoSelector+' .inner p span.dot2', 'bounceIn');
            setTimeout(function() {
              callback(step9_dot3It, 50);
            }, timeout);
          };
          var step9_dot3It = function(callback, timeout) {
            logo.find('span.dot3').addClass('dot-show');
            addAnimateCssClass(logoSelector+' .inner p span.dot3', 'bounceIn');
          };
          
          


          step1_zoomIn(step2_roundIt, 1000);

        };
        },
        link: function (scope, elem, attrs) {
          scope.logo();
        }
    };
});