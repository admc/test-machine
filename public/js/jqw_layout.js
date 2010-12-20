jqwizard.layout = {
  intro: {
    buttons: {
      "No Thanks": function() { $(this).dialog("close"); },
      "Continue": function() { jqwizard.morphDialog("stepOne"); }
    },
    init: function() { if (!jqwizard.os) { $(".jqwOS").html(jqwizard.getOS()); } }
  },
  stepOne: {
    buttons: {
      "Back": function() { jqwizard.morphDialog("intro"); },
      "Continue": function() { jqwizard.morphDialog("stepTwo"); }
    },
  },
  stepTwo: {
    buttons: {
      "Back": function() { jqwizard.morphDialog("stepOne"); },
      "Continue": function() { jqwizard.morphDialog("stepThree"); }
    },
  },
  stepThree: {
    buttons: {
      "Back": function() { jqwizard.morphDialog("stepTwo"); },
      "Continue": function() { jqwizard.morphDialog("thanks"); }
    },
  },
  thanks: {
    buttons: {
      "Back": function() { jqwizard.morphDialog("stepThree"); },
      "I'm Finished!": function() { $(this).dialog("close"); }
    }
  }
};
