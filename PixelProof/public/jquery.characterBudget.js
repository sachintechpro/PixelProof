/* Example reusable jQuery plugin. Manages its own event namespace and widget state. */
(function($){'use strict';
  $.fn.characterBudget=function(options){
    const opts=$.extend({max:160,counter:null,warningAt:.85},options);
    return this.each(function(){
      const $input=$(this),$counter=$(opts.counter);
      const update=()=>{
        const used=Array.from($input.val()).length;
        $counter.text(`${used} / ${opts.max}`);
        $counter.toggleClass('warning',used>=opts.max*opts.warningAt);
        $counter.attr('aria-label',`${used} of ${opts.max} characters used`);
      };
      $input.off('.characterBudget').on('input.characterBudget change.characterBudget',update);
      update();
    });
  };
})(window.jQuery);
