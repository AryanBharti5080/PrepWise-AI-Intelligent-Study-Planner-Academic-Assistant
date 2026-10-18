from pydantic import BaseModel, Field, field_validator


class CareerRecommendationRequest(BaseModel):
    interest: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's career interest or preferred career domain.",
    )

    @field_validator("interest")
    @classmethod
    def validate_interest(cls, value: str) -> str:
        value = " ".join(value.split())

        if not value:
            raise ValueError("Interest cannot be empty.")

        return value


class SaveCareerRecommendationRequest(BaseModel):
    interest: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The career interest associated with the recommendation.",
    )

    recommendation: str = Field(
        ...,
        min_length=1,
        description="The generated career recommendation to save.",
    )

    @field_validator("interest")
    @classmethod
    def validate_interest(cls, value: str) -> str:
        value = " ".join(value.split())

        if not value:
            raise ValueError("Interest cannot be empty.")

        return value

    @field_validator("recommendation")
    @classmethod
    def validate_recommendation(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Recommendation cannot be empty.")

        return value