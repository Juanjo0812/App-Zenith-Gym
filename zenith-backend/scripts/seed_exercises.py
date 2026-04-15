"""
Script de inicialización (seed): Inserta 15+ ejercicios comunes de gimnasio en la base de datos.
Ejecutar: python -m scripts.seed_exercises   (desde zenith-backend/)
"""
import asyncio
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.database.base import async_session_factory
from src.infrastructure.database.models import ExerciseModel


EXERCISES = [
    # ── Pecho ───────────────────────────────────────────
    {
        "name": "Press de banca",
        "primary_muscle": "Pecho",
        "secondary_muscles": ["Tríceps", "Deltoides frontales"],
        "equipment": "Barra",
        "difficulty": "Intermedio",
        "instructions": "Acuéstate en un banco plano. Sujeta la barra un poco más ancho que el ancho de los hombros. Baja hasta el pecho medio y empuja hasta extender completamente los brazos.",
    },
    {
        "name": "Press inclinado con mancuernas",
        "primary_muscle": "Pecho",
        "secondary_muscles": ["Deltoides frontales", "Tríceps"],
        "equipment": "Mancuernas",
        "difficulty": "Intermedio",
        "instructions": "Ajusta el banco entre 30 y 45 grados. Empuja las mancuernas desde el nivel del pecho hasta extender completamente los brazos.",
    },
    {
        "name": "Aperturas en polea",
        "primary_muscle": "Pecho",
        "secondary_muscles": ["Deltoides frontales"],
        "equipment": "Máquina de poleas",
        "difficulty": "Principiante",
        "instructions": "Coloca las poleas a la altura del pecho. Lleva las manijas hacia el centro en un movimiento de abrazo y contrae el pecho al final.",
    },

    # ── Espalda ────────────────────────────────────────────
    {
        "name": "Remo con barra",
        "primary_muscle": "Espalda",
        "secondary_muscles": ["Bíceps", "Deltoides posteriores"],
        "equipment": "Barra",
        "difficulty": "Intermedio",
        "instructions": "Inclina el torso desde la cadera y lleva la barra hacia la parte baja del pecho o abdomen superior. Aprieta las escápulas.",
    },
    {
        "name": "Dominadas",
        "primary_muscle": "Espalda",
        "secondary_muscles": ["Bíceps", "Antebrazos"],
        "equipment": "Barra de dominadas",
        "difficulty": "Intermedio",
        "instructions": "Cuélgate de la barra con agarre prono. Sube hasta que la barbilla pase la barra y baja de forma controlada.",
    },
    {
        "name": "Jalón al pecho",
        "primary_muscle": "Espalda",
        "secondary_muscles": ["Bíceps"],
        "equipment": "Máquina de poleas",
        "difficulty": "Principiante",
        "instructions": "Sujeta la barra ancha y llévala hacia la parte superior del pecho mientras contraes los dorsales. Regresa lentamente.",
    },

    # ── Hombros ───────────────────────────────────────────
    {
        "name": "Press militar",
        "primary_muscle": "Hombros",
        "secondary_muscles": ["Tríceps", "Pecho superior"],
        "equipment": "Barra",
        "difficulty": "Intermedio",
        "instructions": "Empuja la barra desde la posición frente al pecho hasta extender completamente sobre la cabeza. Mantén el core firme.",
    },
    {
        "name": "Elevaciones laterales",
        "primary_muscle": "Hombros",
        "secondary_muscles": [],
        "equipment": "Mancuernas",
        "difficulty": "Principiante",
        "instructions": "Eleva las mancuernas hacia los lados hasta que los brazos queden paralelos al suelo. Baja lentamente.",
    },

    # ── Piernas ────────────────────────────────────────────
    {
        "name": "Sentadilla con barra",
        "primary_muscle": "Piernas",
        "secondary_muscles": ["Glúteos", "Core"],
        "equipment": "Barra",
        "difficulty": "Intermedio",
        "instructions": "Coloca la barra en la parte superior de la espalda. Baja hasta que los muslos estén paralelos al suelo o más abajo y sube empujando con los talones.",
    },
    {
        "name": "Peso muerto rumano",
        "primary_muscle": "Piernas",
        "secondary_muscles": ["Glúteos", "Espalda baja"],
        "equipment": "Barra",
        "difficulty": "Intermedio",
        "instructions": "Flexiona desde la cadera manteniendo las piernas casi rectas. Baja la barra cerca de las piernas hasta sentir estiramiento en los isquiotibiales y vuelve a subir.",
    },
    {
        "name": "Prensa de piernas",
        "primary_muscle": "Piernas",
        "secondary_muscles": ["Glúteos"],
        "equipment": "Máquina de prensa",
        "difficulty": "Principiante",
        "instructions": "Coloca los pies al ancho de los hombros en la plataforma. Baja el peso hasta formar un ángulo de 90° en las rodillas y empuja hacia arriba.",
    },
    {
        "name": "Curl de piernas",
        "primary_muscle": "Piernas",
        "secondary_muscles": [],
        "equipment": "Máquina",
        "difficulty": "Principiante",
        "instructions": "Acuéstate boca abajo en la máquina. Flexiona las piernas llevando el peso hacia los glúteos y contrae los isquiotibiales.",
    },

    # ── Brazos ────────────────────────────────────────────
    {
        "name": "Curl con barra",
        "primary_muscle": "Bíceps",
        "secondary_muscles": ["Antebrazos"],
        "equipment": "Barra",
        "difficulty": "Principiante",
        "instructions": "Mantente de pie y lleva la barra desde los muslos hasta los hombros. Mantén los codos pegados al cuerpo.",
    },
    {
        "name": "Extensión de tríceps en polea",
        "primary_muscle": "Tríceps",
        "secondary_muscles": [],
        "equipment": "Máquina de poleas",
        "difficulty": "Principiante",
        "instructions": "Sujeta la cuerda o barra de la polea. Empuja hacia abajo hasta extender completamente los brazos y contrae los tríceps.",
    },

    # ── Core ────────────────────────────────────────────
    {
        "name": "Elevaciones de piernas colgado",
        "primary_muscle": "Core",
        "secondary_muscles": ["Flexores de cadera"],
        "equipment": "Barra de dominadas",
        "difficulty": "Intermedio",
        "instructions": "Cuélgate de la barra. Eleva las piernas hasta 90° o más y bájalas de forma controlada. Evita balancearte.",
    },
    {
        "name": "Crunch en polea",
        "primary_muscle": "Core",
        "secondary_muscles": [],
        "equipment": "Máquina de poleas",
        "difficulty": "Principiante",
        "instructions": "Arrodíllate debajo de la polea alta. Flexiona el torso llevando los codos hacia las rodillas. Concéntrate en contraer el abdomen.",
    },
]


async def seed():
    async with async_session_factory() as session:
        # Verificar si los ejercicios ya existen
        from sqlalchemy.future import select
        result = await session.execute(select(ExerciseModel).limit(1))
        if result.scalars().first():
            print("⚠️  Los ejercicios ya fueron insertados. Omitiendo.")
            return

        for data in EXERCISES:
            exercise = ExerciseModel(
                id=uuid.uuid4(),
                name=data["name"],
                primary_muscle=data["primary_muscle"],
                secondary_muscles=data.get("secondary_muscles", []),
                equipment=data.get("equipment"),
                difficulty=data.get("difficulty"),
                instructions=data.get("instructions"),
                video_url=data.get("video_url"),
            )
            session.add(exercise)

        await session.commit()
        print(f"✅ ¡Se insertaron {len(EXERCISES)} ejercicios correctamente!")


if __name__ == "__main__":
    asyncio.run(seed())
