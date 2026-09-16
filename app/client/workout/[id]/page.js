// Sauvegarde finale de la séance dans la table workout_logs
  const handleFinishWorkout = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Structuration propre des performances par exercice
      const formattedPerformances = exercises.map((ex) => {
        const setsData = [];
        
        for (let i = 0; i < ex.sets; i++) {
          const key = `${ex.id}-${i}`;
          const perf = actualPerformances[key] || {};
          const isDone = !!completedSets[key];

          setsData.push({
            set_index: i + 1,
            reps: perf.reps || ex.reps || "-",
            weight: perf.weight || ex.target_weight || null,
            completed: isDone
          });
        }

        return {
          exercise_id: ex.id,
          name: ex.name,
          comment: exerciseComments[ex.id] || null,
          sets: setsData
        };
      });

      // 2. Enregistrement dans Supabase
      const { error } = await supabase.from("workout_logs").insert([
        {
          program_id: programId,
          user_id: user.id,
          duration_seconds: timerSeconds,
          completed_sets: completedSets,
          actual_performances: formattedPerformances, // <--- Enregistre un tableau structuré
          exercise_comments: exerciseComments,
          student_comment: studentComment,
          status: "completed"
        }
      ]);

      if (error) throw error;
      alert("Séance enregistrée avec succès ! 💪");
      window.location.href = "/client";
    } catch (err) {
      alert("Erreur lors de l'enregistrement : " + err.message);
    } finally {
      setSaving(false);
    }
  };
