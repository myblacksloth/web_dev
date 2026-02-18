angular.module('testApp', [])
  .controller('TestCtrl', function($scope, $q, $timeout) {

    $scope.logs = [];

    // ------------------------------------
    // Simula chiamate HTTP
    // ------------------------------------
    function fakeHttp(apiName, shouldFail) {
      $scope.logs.push({ type: 'info', msg: '--> Chiamo ' + apiName + '...' });
      return $timeout(function() {}, 500).then(function() {
        if (shouldFail) {
          return $q.reject({ message: 'Errore simulato su ' + apiName });
        }
        return { data: 'risposta da ' + apiName };
      });
    }

    // ------------------------------------
    // PATTERN 1 — chiamate INDIPENDENTI
    // Usa $q.all: tutte partono insieme, aspetti che finiscano tutte
    // Se una fallisce, vai subito nel catch
    // ------------------------------------
    $scope.runParallel = function(failAt) {
      $scope.logs.push({ type: 'info', msg: '=== PARALLEL (failAt=' + failAt + ') ===' });

      $q.all([
        fakeHttp('API 1', failAt === 1),
        fakeHttp('API 2', failAt === 2),
        fakeHttp('API 3', failAt === 3)
      ])
      .then(function(results) {
        // results[0] = risposta API 1
        // results[1] = risposta API 2
        // results[2] = risposta API 3
        var res1 = results[0];
        var res2 = results[1];
        var res3 = results[2];

        $scope.logs.push({ type: 'success', msg: 'OK API 1: ' + res1.data });
        $scope.logs.push({ type: 'success', msg: 'OK API 2: ' + res2.data });
        $scope.logs.push({ type: 'success', msg: 'OK API 3: ' + res3.data });
        $scope.logs.push({ type: 'success', msg: '=== Tutte completate ===' });
      })
      .catch(function(err) {
        $scope.logs.push({ type: 'error', msg: '*** ERRORE: ' + err.message });
      });
    };

    // ------------------------------------
    // PATTERN 2 — chiamate SEQUENZIALI con reduce
    // Le chiamate dipendono l'una dall'altra
    // Ogni step riceve la risposta del precedente
    // ------------------------------------
    $scope.runSequential = function(failAt) {
      $scope.logs.push({ type: 'info', msg: '=== SEQUENTIAL (failAt=' + failAt + ') ===' });

      // Definisci gli step come array di funzioni
      // Ogni funzione riceve la risposta dello step precedente
      var steps = [
        function(prev) { return fakeHttp('API 1', failAt === 1); },
        function(prev) { return fakeHttp('API 2', failAt === 2); },
        function(prev) { return fakeHttp('API 3', failAt === 3); }
      ];

      // Accumula le risposte
      var risposte = [];

      // Esegui gli step in sequenza con reduce
      steps.reduce(function(promise, step, index) {
        return promise.then(function(res) {
          if (res) {
            risposte.push(res);
            $scope.logs.push({ type: 'success', msg: 'OK API ' + index + ': ' + res.data });
          }
          return step(res);
        });
      }, $q.resolve())
      .then(function(lastRes) {
        risposte.push(lastRes);
        $scope.logs.push({ type: 'success', msg: 'OK API 3: ' + lastRes.data });
        $scope.logs.push({ type: 'success', msg: '=== Sequenza completata ===' });

        // Qui hai tutte le risposte
        // risposte[0] = API 1, risposte[1] = API 2, risposte[2] = API 3
        $scope.logs.push({ type: 'info', msg: 'Risposte raccolte: ' + risposte.length });
      })
      .catch(function(err) {
        $scope.logs.push({ type: 'error', msg: '*** ERRORE: ' + err.message });
      });
    };

    $scope.clearLog = function() {
      $scope.logs = [];
    };
  });
  